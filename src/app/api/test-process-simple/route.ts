import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import { withErrorHandler, ValidationError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import env from '@/lib/env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

async function testProcessHandler(request: NextRequest) {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  try {
    // Simple test with hardcoded interview ID
    const interviewId = '61fc06cf-d993-4682-aa59-8e77b3c6d9c4'
    
    console.log(`[TEST] Starting simple processing for interview ${interviewId}`)
    
    // Fetch interview record
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single()
    
    if (fetchError || !interview) {
      console.error('[TEST] Interview not found', fetchError)
      return createSuccessResponse({ status: 'failed', error: 'Interview not found' })
    }

    console.log(`[TEST] Processing interview: ${interview.file_name}`)

    // Download file from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('interviews')
      .download(interview.file_path)
    
    if (downloadError || !fileData) {
      console.error('[TEST] Failed to download file:', downloadError)
      return createSuccessResponse({ status: 'failed', error: 'File download failed' })
    }

    console.log(`[TEST] Downloaded file: ${interview.file_name}`)

    // Convert file data to text content
    let textContent: string
    try {
      const fileBuffer = await fileData.arrayBuffer()
      console.log(`[TEST] File buffer size: ${fileBuffer.byteLength} bytes`)
      
      if (fileBuffer.byteLength === 0) {
        throw new Error('File buffer is empty')
      }
      
      textContent = new TextDecoder().decode(fileBuffer)
      console.log(`[TEST] Extracted text content (${textContent.length} characters)`)
      console.log(`[TEST] Text preview:`, textContent.substring(0, 200))
    } catch (error) {
      console.error('[TEST] Failed to extract text from file:', error)
      return createSuccessResponse({ status: 'failed', error: 'Text extraction failed' })
    }

    // Simple AI analysis without product context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert research analyst. Extract structured data from interview transcripts as JSON with these fields: subject_name, summary, keywords (array), sentiment (0-10), pmf_score (0-100).`
        },
        {
          role: 'user',
          content: `Analyze this interview transcript and return JSON:

Interview Transcript:
${textContent.substring(0, 1000)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })

    const responseText = completion.choices[0]?.message?.content || ''
    console.log(`[TEST] AI response: ${responseText}`)

    return createSuccessResponse({ 
      status: 'success', 
      response: responseText,
      textLength: textContent.length,
      error: ''
    })

  } catch (error) {
    console.error('[TEST] Processing error:', error)
    return createSuccessResponse({ 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const POST = withErrorHandler(testProcessHandler) 