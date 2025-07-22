import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Testing simple file upload to product-documents bucket')
    
    // Create a simple test file
    const testContent = 'This is a test interview file for testing upload functionality.'
    const buffer = Buffer.from(testContent, 'utf-8')
    const fileName = `test-${Date.now()}.txt`
    const filePath = `uploads/${fileName}`
    
    console.log(`[TEST] Attempting to upload: ${filePath}`)
    
    // Upload to product-documents bucket
    const { data, error } = await supabase.storage
      .from('product-documents')
      .upload(filePath, buffer, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('[TEST] Upload failed:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Upload failed',
        details: error
      })
    }
    
    console.log('[TEST] Upload successful:', data)
    
    // Verify the file exists
    const { data: files, error: listError } = await supabase.storage
      .from('product-documents')
      .list('uploads')
    
    if (listError) {
      console.error('[TEST] Failed to list files:', listError)
    } else {
      console.log('[TEST] Files in uploads folder:', files)
    }
    
    return NextResponse.json({ 
      success: true,
      uploadedFile: data,
      filesInBucket: files || []
    })
    
  } catch (error) {
    console.error('[TEST] Upload test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload test failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 