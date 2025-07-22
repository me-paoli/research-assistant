import { NextRequest, NextResponse } from 'next/server'
import env from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Environment check')
    console.log('[TEST] SUPABASE_URL length:', env.NEXT_PUBLIC_SUPABASE_URL.length)
    console.log('[TEST] SUPABASE_ANON_KEY length:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length)
    console.log('[TEST] OPENAI_API_KEY length:', env.OPENAI_API_KEY.length)
    console.log('[TEST] OPENAI_API_KEY starts with:', env.OPENAI_API_KEY.substring(0, 7))
    
    return NextResponse.json({ 
      success: true,
      envCheck: {
        supabaseUrlLength: env.NEXT_PUBLIC_SUPABASE_URL.length,
        supabaseKeyLength: env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length,
        openaiKeyLength: env.OPENAI_API_KEY.length,
        openaiKeyPrefix: env.OPENAI_API_KEY.substring(0, 7)
      }
    })
    
  } catch (error) {
    console.error('[TEST] Environment check failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Environment check failed'
    }, { status: 500 })
  }
} 