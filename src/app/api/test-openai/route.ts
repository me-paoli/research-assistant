import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import env from '@/lib/env'
import { Readable } from 'stream'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function GET(request: NextRequest) {
  try {
    // Create a test file content
    const testContent = "This is a test interview transcript. Interviewer: Hi Sarah, how are you today? Sarah: I am doing well, thank you for asking. Interviewer: Can you tell us about your experience with project management tools? Sarah: I have been using various tools for about 3 years now. I started with Trello but found it too simple for complex projects. Then I tried Asana, which was better but still had some issues with team collaboration."
    const buffer = Buffer.from(testContent, 'utf-8')
    
    console.log('[TEST] Buffer size:', buffer.byteLength)
    
    // Create a readable stream from the buffer
    const stream = Readable.from(buffer)
    
    console.log('[TEST] Stream created from buffer')
    
    // Try to upload to OpenAI
    console.log('[TEST] Attempting OpenAI file upload...')
    const file = await openai.files.create({
      file: stream as any, // Type assertion for Node.js compatibility
      purpose: 'assistants'
    })
    
    console.log('[TEST] OpenAI file upload successful:', file.id)
    
    // Clean up the file
    await openai.files.delete(file.id)
    console.log('[TEST] File cleaned up')
    
    return NextResponse.json({ 
      success: true,
      fileId: file.id,
      message: 'OpenAI file upload test successful'
    })
  } catch (error) {
    console.error('[TEST] OpenAI file upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'OpenAI upload failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 