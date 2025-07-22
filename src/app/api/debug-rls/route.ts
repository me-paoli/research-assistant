import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[RLS DEBUG] Checking RLS status and database operations')
    
    // Check RLS status on interviews table
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('is_row_security_enabled')
      .eq('table_schema', 'public')
      .eq('table_name', 'interviews')
      .single()
    
    console.log('[RLS DEBUG] RLS status:', rlsStatus)
    
    // Check existing policies
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'interviews')
    
    console.log('[RLS DEBUG] Policies:', policies)
    
    // Test basic SELECT operation
    const { data: selectData, error: selectError } = await supabase
      .from('interviews')
      .select('id')
      .limit(1)
    
    console.log('[RLS DEBUG] SELECT test:', { data: selectData, error: selectError })
    
    // Test INSERT operation (this is what's failing)
    const testRecord = {
      file_name: 'debug-test.txt',
      file_path: 'debug/test.txt',
      file_size: 100,
      status: 'debug'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('interviews')
      .insert([testRecord])
      .select()
      .single()
    
    console.log('[RLS DEBUG] INSERT test:', { data: insertData, error: insertError })
    
    // Clean up test record if it was created
    if (insertData) {
      await supabase
        .from('interviews')
        .delete()
        .eq('id', insertData.id)
    }
    
    // Check if there are any triggers or constraints
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_schema', 'public')
      .eq('event_object_table', 'interviews')
    
    console.log('[RLS DEBUG] Triggers:', triggers)
    
    return NextResponse.json({ 
      success: true,
      rlsStatus: rlsStatus?.is_row_security_enabled || false,
      policies: policies || [],
      operations: {
        select: { success: !selectError, error: selectError?.message || null },
        insert: { success: !insertError, error: insertError?.message || null }
      },
      triggers: triggers || [],
      recommendations: {
        rlsEnabled: rlsStatus?.is_row_security_enabled || false,
        hasPolicies: policies && policies.length > 0,
        insertBlocked: !!insertError,
        needsPolicyCheck: insertError?.message?.includes('row-level security')
      }
    })
    
  } catch (error) {
    console.error('[RLS DEBUG] Debug failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'RLS debug failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 