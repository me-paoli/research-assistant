import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError, NotFoundError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { InterviewResponse } from '@/types/api'
import { processInterview } from '@/services/interviewProcess'

async function getInterviewHandler(request: NextRequest): Promise<NextResponse<InterviewResponse>> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('No id provided')
  }

  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
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

  // Fetch interview to get file path
  const { data: interview, error: fetchError } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !interview) {
    throw new NotFoundError('Interview not found')
  }

  // Delete file from storage
  if (interview.file_path) {
    await supabase.storage.from('product-documents').remove([interview.file_path])
  }

  // Delete interview record
  const { error: deleteError } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id)

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