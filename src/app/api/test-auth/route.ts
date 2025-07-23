import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler, ValidationError } from '@/lib/errors'

async function testAuthHandler(request: NextRequest): Promise<NextResponse> {
  console.log('=== TEST AUTH ENDPOINT ===')
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  const authHeader = request.headers.get('Authorization')
  console.log('Auth header:', authHeader)
  
  const jwt = authHeader?.replace('Bearer ', '')
  console.log('JWT exists:', !!jwt)
  console.log('JWT length:', jwt?.length || 0)
  
  if (!jwt) {
    return NextResponse.json({ error: 'No JWT provided' }, { status: 401 })
  }
  
  // Test with anon key
  const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
  
  console.log('User from JWT:', user ? user.id : 'not found')
  console.log('Auth error:', authError)
  
  if (!user || authError) {
    return NextResponse.json({ error: 'Authentication failed', details: authError }, { status: 401 })
  }
  
  return NextResponse.json({ 
    success: true, 
    user: { id: user.id, email: user.email },
    message: 'Authentication successful'
  })
}

export const GET = withErrorHandler(testAuthHandler) 