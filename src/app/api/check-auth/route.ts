import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[AUTH] Checking authentication status')
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('[AUTH] User:', user)
    console.log('[AUTH] User error:', userError)
    
    // Check if we can access the interviews table
    const { data: interviews, error: tableError } = await supabase
      .from('interviews')
      .select('id')
      .limit(1)
    
    console.log('[AUTH] Table access test:', { interviews, tableError })
    
    // Try to insert a test record
    const testRecord = {
      file_name: 'test-auth-check.txt',
      file_path: 'test/path.txt',
      file_size: 100,
      status: 'pending'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('interviews')
      .insert([testRecord])
      .select()
      .single()
    
    console.log('[AUTH] Insert test:', { insertData, insertError })
    
    // If insert succeeded, clean up the test record
    if (insertData) {
      await supabase
        .from('interviews')
        .delete()
        .eq('id', insertData.id)
    }
    
    return NextResponse.json({ 
      success: true,
      authentication: {
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null,
        userError: userError?.message || null,
        isAuthenticated: !!user
      },
      databaseAccess: {
        canSelect: !tableError,
        canInsert: !insertError,
        tableError: tableError?.message || null,
        insertError: insertError?.message || null
      },
      recommendations: {
        needsAuth: !user,
        needsRLS: insertError?.message?.includes('row-level security'),
        needsPolicies: insertError?.message?.includes('row-level security')
      }
    })
    
  } catch (error) {
    console.error('[AUTH] Check failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Auth check failed',
      details: JSON.stringify(error, null, 2)
    }, { status: 500 })
  }
} 