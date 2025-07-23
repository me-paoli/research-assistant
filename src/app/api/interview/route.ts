import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError, NotFoundError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { InterviewResponse } from '@/types/api'
import { processInterview } from '@/services/interviewProcess'
import { createClient } from '@supabase/supabase-js'

async function getInterviewHandler(request: NextRequest): Promise<NextResponse<InterviewResponse>> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('No id provided')
  }

  // Get the current user (using service role key for server-side auth)
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

  const { data, error } = await supabaseWithAuth
    .from('interviews')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    throw new NotFoundError('Interview not found')
  }

  return createSuccessResponse({ interview: data })
}

async function deleteInterviewHandler(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('No id provided')
  }

  // Get the current user (using service role key for server-side auth)
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

  // Fetch interview to get file path and check user_id
  const { data: interview, error: fetchError } = await supabaseWithAuth
    .from('interviews')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !interview) {
    throw new NotFoundError('Interview not found')
  }

  // Delete file from storage
  if (interview.file_path) {
    await supabaseWithAuth.storage.from('product-documents').remove([interview.file_path])
  }

  // Delete interview record
  const { error: deleteError } = await supabaseWithAuth
    .from('interviews')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    throw new InternalServerError(deleteError.message)
  }

  return createSuccessResponse({ success: true })
}

async function processInterviewHandler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  try {
    const { rawText } = await request.json()
    
    if (!rawText) {
      return NextResponse.json({ error: "rawText required" }, { status: 400 })
    }

    // Get product context summary (using existing stub for now)
    const productSummary = await getProductContextSummary()
    
    // Process the interview with automatic mode selection
    const result = await processInterview("temp-id", rawText, productSummary.summaryText ?? productSummary)

    return NextResponse.json(result, { status: 200 })
  } catch (e: any) {
    console.error('Interview processing error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Helper function to get product context (placeholder for now)
async function getProductContextSummary() {
  try {
    const { data: product } = await supabase
      .from('product_context')
      .select('name, description, url')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (product) {
      return {
        summaryText: `${product.name || 'Unknown Product'}: ${product.description || 'No description'}`
      }
    }
    
    return {
      summaryText: "Default product context"
    }
  } catch (error) {
    console.error('Error fetching product context:', error)
    return {
      summaryText: "Default product context"
    }
  }
}

export const GET = withErrorHandler(getInterviewHandler)
export const DELETE = withErrorHandler(deleteInterviewHandler)
export const POST = withErrorHandler(processInterviewHandler) 