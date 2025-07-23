import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { InterviewsResponse } from '@/types/api'
import { createClient } from '@supabase/supabase-js'

async function interviewsHandler(request: NextRequest): Promise<NextResponse<InterviewsResponse>> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  // Get the current user (using anon key for JWT validation)
  const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const authHeader = request.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')
  
  if (!jwt) {
    throw new ValidationError('No authentication token provided')
  }
  
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
  if (!user || authError) {
    throw new ValidationError('Not authenticated')
  }

  // Create a Supabase client with the user's JWT for database operations
  const supabaseWithAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    }
  )

  const { data, error } = await supabaseWithAuth
    .from('interviews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({ interviews: data || [] })
}

export const GET = withErrorHandler(interviewsHandler) 