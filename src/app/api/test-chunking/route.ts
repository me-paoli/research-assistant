import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { processInterviewChunks } from '@/lib/chunking-service'

export const GET = async (req: NextRequest) => {
  const interviewId = req.nextUrl.searchParams.get('id')
  if (!interviewId) return NextResponse.json({ error: 'No id' })

  // Fetch the interview transcript
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .single()

  if (error || !interview) {
    return NextResponse.json({ error: 'Interview not found', details: error })
  }

  // Use the summary, transcript, or file content as the transcript
  let transcript = interview.transcript || interview.summary || ''
  if (!transcript) {
    return NextResponse.json({ error: 'No transcript or summary found for this interview.' })
  }

  // Run chunking
  const result = await processInterviewChunks(interviewId, transcript)
  return NextResponse.json(result)
} 