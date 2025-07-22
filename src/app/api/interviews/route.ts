import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { InterviewsResponse } from '@/types/api'

async function interviewsHandler(request: NextRequest): Promise<NextResponse<InterviewsResponse>> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({ interviews: data || [] })
}

export const GET = withErrorHandler(interviewsHandler) 