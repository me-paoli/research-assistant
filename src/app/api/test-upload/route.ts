import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    // Create a simple test file
    const testContent = "This is a test file for debugging upload issues."
    const buffer = Buffer.from(testContent, 'utf-8')
    
    console.log('[TEST] Attempting to upload test file')
    
    // Upload to Supabase storage
    const uploadResult = await StorageService.uploadInterviewFile(buffer, 'test-file.txt', 'text/plain')
    
    console.log('[TEST] Upload result:', uploadResult)
    
    if (!uploadResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: uploadResult.error,
        uploadResult 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      filePath: uploadResult.filePath,
      fileId: uploadResult.fileId,
      uploadResult 
    })
  } catch (error) {
    console.error('[TEST] Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 })
  }
} 