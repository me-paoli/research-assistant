import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Testing file download from Supabase')
    
    const body = await request.json()
    const { interviewId } = body
    
    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId required' }, { status: 400 })
    }
    
    // Fetch interview record
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single()
    
    if (fetchError || !interview) {
      console.error('[TEST] Interview not found:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Interview not found',
        details: fetchError
      })
    }
    
    console.log(`[TEST] Found interview: ${interview.file_name}`)
    console.log(`[TEST] File path: ${interview.file_path}`)
    
    // Download file from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('product-documents')
      .download(interview.file_path)
    
    if (downloadError || !fileData) {
      console.error('[TEST] Failed to download file:', downloadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to download file',
        details: downloadError
      })
    }
    
    console.log(`[TEST] Successfully downloaded file`)
    console.log(`[TEST] File data type:`, typeof fileData)
    console.log(`[TEST] File data properties:`, Object.keys(fileData))
    
    // Try to extract text content
    try {
      const fileBuffer = await fileData.arrayBuffer()
      console.log(`[TEST] File buffer size: ${fileBuffer.byteLength} bytes`)
      
      if (fileBuffer.byteLength === 0) {
        throw new Error('File buffer is empty')
      }
      
      const textContent = new TextDecoder().decode(fileBuffer)
      console.log(`[TEST] Extracted text content (${textContent.length} characters)`)
      console.log(`[TEST] Text preview:`, textContent.substring(0, 200))
      
      return NextResponse.json({ 
        success: true,
        fileName: interview.file_name,
        filePath: interview.file_path,
        bufferSize: fileBuffer.byteLength,
        textLength: textContent.length,
        textPreview: textContent.substring(0, 200)
      })
      
    } catch (error) {
      console.error('[TEST] Failed to extract text:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to extract text from file',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
  } catch (error) {
    console.error('[TEST] File download test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Test failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 