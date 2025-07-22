import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[BUCKET] Attempting to create uploads bucket')
    
    // Create the uploads bucket
    const { data, error } = await supabase.storage.createBucket('uploads', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
    })
    
    if (error) {
      console.error('[BUCKET] Failed to create bucket:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create bucket',
        details: error
      })
    }
    
    console.log('[BUCKET] Successfully created uploads bucket')
    
    // Verify the bucket was created
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('[BUCKET] Failed to list buckets:', listError)
    } else {
      console.log('[BUCKET] Available buckets:', buckets)
    }
    
    return NextResponse.json({ 
      success: true,
      bucket: data,
      availableBuckets: buckets || []
    })
    
  } catch (error) {
    console.error('[BUCKET] Create bucket error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Create bucket failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 