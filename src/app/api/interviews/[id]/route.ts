import { NextRequest, NextResponse } from 'next/server'
import { ValidationError, ApiError, InternalServerError, createSuccessResponse, createErrorResponse } from '@/lib/errors'
import { createClient } from '@supabase/supabase-js'

async function deleteInterviewHandler(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  if (request.method !== 'DELETE') {
    throw new ValidationError('Method not allowed')
  }

  const interviewId = params.id
  if (!interviewId) {
    throw new ValidationError('Interview ID is required')
  }

  // Require authentication
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const authHeader = request.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) {
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

  try {
    // First, delete associated chunks
    const { error: chunksError } = await supabaseWithAuth
      .from('interview_chunks')
      .delete()
      .eq('interview_id', interviewId)

    if (chunksError) {
      console.error('[DELETE_INTERVIEW] Error deleting chunks:', chunksError)
      throw new Error(`Failed to delete interview chunks: ${chunksError.message}`)
    }

    // Then delete the interview
    const { error: interviewError } = await supabaseWithAuth
      .from('interviews')
      .delete()
      .eq('id', interviewId)
      .eq('user_id', user.id) // Ensure user can only delete their own interviews

    if (interviewError) {
      console.error('[DELETE_INTERVIEW] Error deleting interview:', interviewError)
      throw new Error(`Failed to delete interview: ${interviewError.message}`)
    }

    return createSuccessResponse({
      message: 'Interview deleted successfully',
      interviewId
    })

  } catch (error) {
    console.error('[DELETE_INTERVIEW] Error:', error)
    throw error
  }
}

export const DELETE = async (request: NextRequest) => {
  console.log('=== withErrorHandler START ===')
  console.log('Request method:', request.method)
  console.log('Request URL:', request.url)

  // Extract id param from the URL
  const url = request.nextUrl || new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return createErrorResponse(new ValidationError('Interview ID is required'))
  }
  const params = { id }

  try {
    console.log('=== CALLING HANDLER ===')
    const result = await deleteInterviewHandler(request, { params })
    console.log('=== HANDLER SUCCESS ===')
    return result
  } catch (error) {
    console.error('=== withErrorHandler ERROR ===')
    console.error('API Error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')

    if (error instanceof ApiError) {
      return createErrorResponse(error)
    }

    return createErrorResponse(
      new InternalServerError(error instanceof Error ? error.message : 'Unknown error')
    )
  }
} 