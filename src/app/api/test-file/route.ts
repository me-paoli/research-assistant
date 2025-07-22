import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test File object creation
    const testContent = "This is a test file for debugging File object creation."
    const buffer = Buffer.from(testContent, 'utf-8')
    
    console.log('[TEST] Buffer size:', buffer.byteLength)
    
    // Create a File object
    const fileObject = new File([buffer], 'test.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    })
    
    console.log('[TEST] File object created:', {
      name: fileObject.name,
      size: fileObject.size,
      type: fileObject.type
    })
    
    return NextResponse.json({ 
      success: true,
      fileInfo: {
        name: fileObject.name,
        size: fileObject.size,
        type: fileObject.type
      }
    })
  } catch (error) {
    console.error('[TEST] File object creation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'File creation failed' 
    }, { status: 500 })
  }
} 