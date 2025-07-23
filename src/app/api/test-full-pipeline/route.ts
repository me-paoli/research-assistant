import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import env from '@/lib/env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Starting full pipeline test')
    
    const body = await request.json()
    const { interviewId } = body
    
    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId required' }, { status: 400 })
    }
    
    const results: Record<string, { name: string; success: boolean; details: string | null }> = {
      step1: { name: 'Fetch Interview Record', success: false, details: null },
      step2: { name: 'Download File from Storage', success: false, details: null },
      step3: { name: 'Extract Text Content', success: false, details: null },
      step4: { name: 'OpenAI Chat Completion', success: false, details: null },
      step5: { name: 'Parse JSON Response', success: false, details: null },
      step6: { name: 'Update Database', success: false, details: null }
    }
    
    // Step 1: Fetch interview record
    console.log('[TEST] Step 1: Fetching interview record')
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single()
    
    if (fetchError || !interview) {
      results.step1.details = fetchError?.message || 'Interview not found'
      return NextResponse.json({ success: false, results })
    }
    
    results.step1.success = true
    results.step1.details = `Found interview: ${interview.file_name}`
    console.log(`[TEST] Found interview: ${interview.file_name}`)
    
    // Step 2: Download file from storage
    console.log('[TEST] Step 2: Downloading file from storage')
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('product-documents')
      .download(interview.file_path)
    
    if (downloadError || !fileData) {
      results.step2.details = downloadError?.message || 'File download failed'
      return NextResponse.json({ success: false, results })
    }
    
    results.step2.success = true
    results.step2.details = `Downloaded file: ${interview.file_path}`
    console.log(`[TEST] Downloaded file: ${interview.file_path}`)
    
    // Step 3: Extract text content
    console.log('[TEST] Step 3: Extracting text content')
    let textContent: string
    try {
      const fileBuffer = await fileData.arrayBuffer()
      textContent = new TextDecoder().decode(fileBuffer)
      
      if (textContent.length === 0) {
        results.step3.details = 'Extracted text is empty'
        return NextResponse.json({ success: false, results })
      }
      
      results.step3.success = true
      results.step3.details = `Extracted ${textContent.length} characters`
      console.log(`[TEST] Extracted ${textContent.length} characters`)
    } catch (error) {
      results.step3.details = error instanceof Error ? error.message : 'Text extraction failed'
      return NextResponse.json({ success: false, results })
    }
    
    // Step 4: OpenAI Chat Completion
    console.log('[TEST] Step 4: Testing OpenAI Chat Completion')
    let completion: any
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert research analyst. Extract structured data from interview transcripts and return ONLY a JSON object with these fields:
{
  "subject_name": "string - The name of the person being interviewed",
  "interview_date": "string - Date of the interview (YYYY-MM-DD format if available, otherwise null)",
  "summary": "string - A concise 2-3 sentence summary of the main points discussed",
  "keywords": ["array of strings - Key topics, pain points, or themes mentioned"],
  "sentiment": "number - Overall sentiment score from 0-10 based on reaction to the product demo (0=very negative about the product, 5=neutral/mixed feelings about the product, 10=very positive about the product)",
  "pmf_score": "number - Product-market fit score as a percentage (0-100) based on user's reaction to the product demo"
}`
          },
          {
            role: 'user',
            content: `Please analyze this interview transcript and extract the structured data as specified in your instructions. Return only the JSON object with the required fields.

Interview Transcript:
${textContent.substring(0, 2000)}...` // Limit to first 2000 chars for testing
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
      
      const responseText = completion.choices[0]?.message?.content || ''
      
      if (!responseText) {
        results.step4.details = 'No response from OpenAI'
        return NextResponse.json({ success: false, results })
      }
      
      results.step4.success = true
      results.step4.details = `Received ${responseText.length} characters from OpenAI`
      console.log(`[TEST] Received response from OpenAI: ${responseText.length} characters`)
    } catch (error) {
      results.step4.details = error instanceof Error ? error.message : 'OpenAI API call failed'
      return NextResponse.json({ success: false, results })
    }
    
    // Step 5: Parse JSON Response
    console.log('[TEST] Step 5: Testing JSON parsing')
    try {
      const responseText = completion.choices[0]?.message?.content || ''
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        results.step5.details = 'No JSON found in response'
        return NextResponse.json({ success: false, results })
      }
      
      const analysis = JSON.parse(jsonMatch[0])
      
      if (!analysis.subject_name && !analysis.summary) {
        results.step5.details = 'Invalid JSON structure'
        return NextResponse.json({ success: false, results })
      }
      
      results.step5.success = true
      results.step5.details = `Parsed JSON with ${Object.keys(analysis).length} fields`
      console.log(`[TEST] Parsed JSON successfully`)
    } catch (error) {
      results.step5.details = error instanceof Error ? error.message : 'JSON parsing failed'
      return NextResponse.json({ success: false, results })
    }
    
    // Step 6: Test Database Update
    console.log('[TEST] Step 6: Testing database update')
    try {
      const { error: updateError } = await supabase
        .from('interviews')
        .update({ 
          status: 'test_complete',
          summary: 'Test completed successfully'
        })
        .eq('id', interviewId)
      
      if (updateError) {
        results.step6.details = updateError.message
        return NextResponse.json({ success: false, results })
      }
      
      results.step6.success = true
      results.step6.details = 'Database update successful'
      console.log(`[TEST] Database update successful`)
    } catch (error) {
      results.step6.details = error instanceof Error ? error.message : 'Database update failed'
      return NextResponse.json({ success: false, results })
    }
    
    // Calculate overall success
    const successfulSteps = Object.values(results).filter(step => step.success).length
    const totalSteps = Object.keys(results).length
    const overallSuccess = successfulSteps === totalSteps
    
    console.log(`[TEST] Pipeline test complete: ${successfulSteps}/${totalSteps} steps successful`)
    
    return NextResponse.json({ 
      success: overallSuccess,
      results,
      summary: {
        successfulSteps,
        totalSteps,
        overallSuccess
      }
    })
    
  } catch (error) {
    console.error('[TEST] Full pipeline test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Test failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 