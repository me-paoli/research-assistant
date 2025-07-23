import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { processInterviewChunks } from '@/lib/chunking-service'
import { createClient } from '@supabase/supabase-js'

export const GET = async (req: NextRequest) => {
  const interviewId = req.nextUrl.searchParams.get('id')
  if (!interviewId) return NextResponse.json({ error: 'No id' })

  // Get the current user (using service role key for server-side auth)
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const authHeader = req.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' })
  }

  // Fetch the interview transcript for this user
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .eq('user_id', user.id)
    .single()

  if (error || !interview) {
    return NextResponse.json({ error: 'Interview not found', details: error })
  }

  // Use the summary, transcript, or file content as the transcript
  let transcript = interview.transcript || interview.summary || ''
  if (!transcript) {
    return NextResponse.json({ error: 'No transcript or summary found for this interview.' })
  }

  // Run chunking (pass user_id to processInterviewChunks)
  const result = await processInterviewChunks(interviewId, transcript, 1400, 1700, user.id)
  return NextResponse.json(result)
} 