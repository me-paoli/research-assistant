import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { ProductContextResponse } from '@/types/api'

async function getProductContextHandler(request: NextRequest): Promise<NextResponse<ProductContextResponse>> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  // Fetch the first product context row (or create default if none exists)
  const { data, error } = await supabase
    .from('product_context')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // If no rows exist, return null to indicate no user data
    if (error.code === 'PGRST116') {
      return createSuccessResponse({ 
        productContext: null
      })
    }
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({ productContext: data })
}

async function postProductContextHandler(request: NextRequest): Promise<NextResponse<ProductContextResponse>> {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  const body = await request.json()
  const { name, description, url } = body

  if (!description) {
    throw new ValidationError('Description is required')
  }

  // Delete existing rows and insert new one to ensure single row
  await supabase.from('product_context').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  // Insert the new product context
  const { data, error } = await supabase
    .from('product_context')
    .insert([{ name, description, url }])
    .select()
    .single()

  if (error) {
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({ productContext: data })
}

export const GET = withErrorHandler(getProductContextHandler)
export const POST = withErrorHandler(postProductContextHandler) 