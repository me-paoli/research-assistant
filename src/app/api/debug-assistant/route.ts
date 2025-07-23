import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabase'
import env from '@/lib/env'
import { Readable } from 'stream'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interviewId } = body

    if (!interviewId) {
      return NextResponse.json({ error: 'No interviewId provided' }, { status: 400 })
    }

    console.log(`[DEBUG] Starting debug for interview ${interviewId}`)

    // 1. Fetch interview record
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single()
    
    if (fetchError || !interview) {
      console.error('[DEBUG] Interview not found', fetchError)
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    console.log(`[DEBUG] Found interview: ${interview.file_path}`)

    // 2. Download file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('product-documents')
      .download(interview.file_path)
    
    if (downloadError || !fileData) {
      console.error('[DEBUG] Failed to download file', downloadError)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    console.log(`[DEBUG] Downloaded file, size: ${fileData.size || 'unknown'}`)

    // 3. Create assistant
    const assistant = await openai.beta.assistants.create({
      name: 'Debug Interview Analyzer',
      instructions: `You are an expert product manager and user researcher specializing in user interview analysis. Your task is to extract and analyzestructured data from interview transcripts.

When analyzing interview content, extract the following information as a JSON object:

{
  "subject_name": "string - The name of the person being interviewed",
  "interview_date": "string - Date of the interview (YYYY-MM-DD format if available, otherwise null)",
  "summary": "string - A concise 2-3 sentence summary of the main points discussed",
  "keywords": ["array of strings - Key topics, pain points, or themes mentioned"],
  "sentiment": "number - Overall sentiment score from 0-10 based on reaction to the product demo (0=very negative about the product, 5=neutral/mixed feelings about the product, 10=very positive about the product)",
  "pmf_score": "number - Product-market fit score as a percentage (0-100) based on user's reaction to the product demo"
}

Always return your analysis as a valid JSON object with these exact keys.`,
      model: 'gpt-4o-mini',
      tools: [{ type: 'code_interpreter' }]
    })

    console.log(`[DEBUG] Created assistant: ${assistant.id}`)

    // 4. Create thread
    const thread = await openai.beta.threads.create()
    console.log(`[DEBUG] Created thread: ${thread.id}`)

    // 5. Upload file to OpenAI
    const fileBuffer = await (fileData as any).arrayBuffer()
    // Convert ArrayBuffer to Buffer for Node.js streams
    const buffer = Buffer.from(fileBuffer)
    const stream = Readable.from(buffer)
    
    const file = await openai.files.create({
      file: stream as any,
      purpose: 'assistants'
    })
    console.log(`[DEBUG] Uploaded file: ${file.id}`)

    // 6. Add file to assistant
    await openai.beta.assistants.update(assistant.id, {
      file_ids: [file.id]
    } as any)

    // 7. Add message to thread
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Please analyze this interview file and extract the structured data as specified in your instructions. Return only the JSON object with the required fields.`
    })
    console.log(`[DEBUG] Added message: ${message.id}`)

    // 8. Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    })
    console.log(`[DEBUG] Started run: ${run.id}`)

    // 9. Wait for completion
    let runStatus = run.status
    let attempts = 0
    while ((runStatus === 'queued' || runStatus === 'in_progress') && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id as any)
      runStatus = updatedRun.status
      console.log(`[DEBUG] Run status: ${runStatus} (attempt ${attempts + 1})`)
      attempts++
    }

    console.log(`[DEBUG] Final run status: ${runStatus}`)

    if (runStatus === 'failed') {
      console.error('[DEBUG] Run failed')
      return NextResponse.json({ error: 'Assistant run failed', status: runStatus })
    }

    // 10. Get the response
    const messages = await openai.beta.threads.messages.list(thread.id)
    const lastMessage = messages.data[0] // Most recent message
    
    if (!lastMessage || lastMessage.role !== 'assistant') {
      console.error('[DEBUG] No assistant response found')
      return NextResponse.json({ error: 'No assistant response' }, { status: 500 })
    }

    console.log(`[DEBUG] Got assistant response`)

    // 11. Parse the response
    const content = lastMessage.content[0]
    if (content.type !== 'text') {
      console.error('[DEBUG] Unexpected content type')
      return NextResponse.json({ error: 'Unexpected content type' }, { status: 500 })
    }

    const responseText = content.text.value
    console.log(`[DEBUG] Assistant response: ${responseText}`)

    // 12. Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[DEBUG] No JSON found in response')
      return NextResponse.json({ 
        error: 'No JSON found in response', 
        responseText: responseText.substring(0, 500) 
      }, { status: 500 })
    }

    const analysis = JSON.parse(jsonMatch[0])
    console.log(`[DEBUG] Parsed analysis:`, analysis)

    // 13. Clean up
    try {
      await openai.files.delete(file.id)
      await openai.beta.assistants.delete(assistant.id)
    } catch (error) {
      console.warn('[DEBUG] Failed to clean up:', error)
    }

    return NextResponse.json({ 
      success: true,
      analysis,
      responseText: responseText.substring(0, 500),
      runStatus
    })
    
  } catch (error) {
    console.error('[DEBUG] Fatal error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 