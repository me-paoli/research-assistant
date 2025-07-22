import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[RLS] Checking storage RLS status')
    
    // Check if RLS is enabled on storage.objects
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('is_row_security_enabled')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects')
      .single()
    
    console.log('[RLS] RLS status:', rlsStatus)
    
    // Check existing policies on storage.objects
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects')
    
    console.log('[RLS] Existing policies:', policies)
    
    // Test if we can list files (this will show if permissions work)
    const { data: files, error: listError } = await supabase.storage
      .from('product-documents')
      .list('uploads')
    
    console.log('[RLS] Can list files:', !listError, 'Files found:', files?.length || 0)
    
    // Test if we can download a file (this will show if permissions work)
    const { data: interview } = await supabase
      .from('interviews')
      .select('file_path')
      .eq('id', 'ae9b589e-c955-4093-9cca-67915f1425ef')
      .single()
    
    let downloadTest = null
    if (interview?.file_path) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('interviews')
        .download(interview.file_path)
      
      downloadTest = {
        success: !downloadError,
        error: downloadError?.message || null
      }
    }
    
    return NextResponse.json({ 
      success: true,
      rlsEnabled: rlsStatus?.is_row_security_enabled || false,
      existingPolicies: policies || [],
      listFilesTest: {
        success: !listError,
        filesFound: files?.length || 0,
        error: listError?.message || null
      },
      downloadTest,
      recommendations: {
        needsRLS: !rlsStatus?.is_row_security_enabled,
        needsPolicies: !policies || policies.length === 0,
        currentSetup: 'product-documents bucket with mixed file types'
      }
    })
    
  } catch (error) {
    console.error('[RLS] Check failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'RLS check failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 