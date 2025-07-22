import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Checking Supabase storage')
    
    // List files in product-documents bucket
    const { data: files, error: listError } = await supabase.storage
      .from('product-documents')
      .list('')
    
    if (listError) {
      console.error('[DEBUG] Failed to list files:', listError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to list files',
        details: listError
      })
    }
    
    console.log('[DEBUG] Files in uploads bucket:', files)
    
    // Also check if there are other buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('[DEBUG] Failed to list buckets:', bucketsError)
    } else {
      console.log('[DEBUG] Available buckets:', buckets)
    }
    
    // Get the specific interview record
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', 'ae9b589e-c955-4093-9cca-67915f1425ef')
      .single()
    
    return NextResponse.json({ 
      success: true,
      files: files || [],
      buckets: buckets || [],
      interview: interview || null,
      interviewError: fetchError
    })
    
  } catch (error) {
    console.error('[DEBUG] Storage debug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Debug failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 