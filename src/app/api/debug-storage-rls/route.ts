import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[STORAGE RLS DEBUG] Checking storage RLS status')
    
    // Check RLS status on storage.objects table
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('is_row_security_enabled')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects')
      .single()
    
    console.log('[STORAGE RLS DEBUG] Storage RLS status:', rlsStatus)
    
    // Check existing policies on storage.objects
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects')
    
    console.log('[STORAGE RLS DEBUG] Storage policies:', policies)
    
    // Test storage upload (this might be where the RLS error is coming from)
    const testContent = 'Test storage upload for RLS debug'
    const buffer = Buffer.from(testContent, 'utf-8')
    const fileName = `debug-test-${Date.now()}.txt`
    
    console.log('[STORAGE RLS DEBUG] Testing storage upload')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('interviews')
      .upload(fileName, buffer, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      })
    
    console.log('[STORAGE RLS DEBUG] Upload test:', { data: uploadData, error: uploadError })
    
    // Clean up test file if it was uploaded
    if (uploadData) {
      await supabase.storage
        .from('interviews')
        .remove([fileName])
    }
    
    // Check if there are any other tables that might have RLS issues
    const { data: allTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, is_row_security_enabled')
      .eq('table_schema', 'public')
      .eq('is_row_security_enabled', true)
    
    console.log('[STORAGE RLS DEBUG] All tables with RLS enabled:', allTables)
    
    return NextResponse.json({ 
      success: true,
      storageRlsStatus: rlsStatus?.is_row_security_enabled || false,
      storagePolicies: policies || [],
      uploadTest: {
        success: !uploadError,
        error: uploadError?.message || null,
        data: uploadData
      },
      allTablesWithRLS: allTables || [],
      recommendations: {
        storageRlsEnabled: rlsStatus?.is_row_security_enabled || false,
        hasStoragePolicies: policies && policies.length > 0,
        uploadBlocked: !!uploadError,
        otherTablesWithRLS: allTables && allTables.length > 0
      }
    })
    
  } catch (error) {
    console.error('[STORAGE RLS DEBUG] Debug failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Storage RLS debug failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 