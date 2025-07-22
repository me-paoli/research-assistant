import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    // List files in the root of research-documents bucket
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('product-documents')
      .list('')
    
    // List files in the uploads folder
    const { data: uploadFiles, error: uploadError } = await supabase.storage
      .from('product-documents')
      .list('uploads')
    
    // Try to create the uploads folder if it doesn't exist
    const { data: createFolderData, error: createFolderError } = await supabase.storage
      .from('product-documents')
      .upload('uploads/.keep', new Blob([''], { type: 'text/plain' }), {
        upsert: true
      })
    
    return NextResponse.json({ 
      buckets: buckets?.map(b => b.name) || [],
      rootFiles: rootFiles?.map(f => ({ name: f.name, size: f.metadata?.size })) || [],
      uploadFiles: uploadFiles?.map(f => ({ name: f.name, size: f.metadata?.size })) || [],
      bucket: 'product-documents',
      bucketsError: bucketsError?.message,
      rootError: rootError?.message,
      uploadError: uploadError?.message,
      createFolderError: createFolderError?.message,
      createFolderSuccess: !createFolderError
    })
  } catch (error) {
    return NextResponse.json({ error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
} 