import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { ProductContextResponse } from '@/types/api'
import { createClient } from '@supabase/supabase-js'

async function getProductContextHandler(request: NextRequest): Promise<NextResponse<ProductContextResponse>> {
  console.log('=== GET /api/product-context START ===')
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

  // Fetch the first product context row for this user
  const { data, error } = await supabaseWithAuth
    .from('product_context')
    .select('*')
    .eq('user_id', user.id)
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
  console.log('=== POST /api/product-context START ===')
  console.log('Request method:', request.method)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  try {
    // Check environment variables
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)
    
    // Get the current user (using anon key for JWT validation)
    const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const authHeader = request.headers.get('Authorization')
    console.log('Received auth header:', authHeader)
    console.log('Auth header length:', authHeader?.length || 0)
    console.log('Auth header starts with Bearer:', authHeader?.startsWith('Bearer ') || false)
    
    const jwt = authHeader?.replace('Bearer ', '')
    console.log('JWT token:', jwt ? 'exists' : 'missing')
    console.log('JWT length:', jwt?.length || 0)
    console.log('JWT preview:', jwt ? `${jwt.substring(0, 20)}...` : 'none')
    
    if (!jwt) {
      console.error('No JWT token provided')
      throw new ValidationError('No authentication token provided')
    }
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
    console.log('User from JWT:', user ? user.id : 'not found')
    console.log('Auth error:', authError)
    
    if (!user || authError) {
      console.error('Authentication failed - no user found or auth error:', authError)
      throw new ValidationError('Not authenticated')
    }

    console.log('=== PARSING REQUEST BODY ===')
    const body = await request.json()
    console.log('Request body:', body)
    const { name, description, url } = body
    console.log('Request body:', { name, description, url })

    // Temporarily remove description requirement for testing
    // if (!description) {
    //   throw new ValidationError('Description is required')
    // }

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

    // Delete existing rows for this user and insert new one to ensure single row per user
    console.log('Deleting existing rows for user:', user.id)
    const { error: deleteError } = await supabaseWithAuth.from('product_context').delete().eq('user_id', user.id)
    console.log('Delete error:', deleteError)
    
    // Insert the new product context with user_id
    console.log('Inserting new product context for user:', user.id)
    const { data, error: insertError } = await supabaseWithAuth
      .from('product_context')
      .insert([{ name, description, url, user_id: user.id }])
      .select()
      .single()

    console.log('Insert error:', insertError)
    console.log('Inserted data:', data)

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new InternalServerError(insertError.message)
    }

    return createSuccessResponse({ productContext: data })
  } catch (error) {
    console.error('Product context POST error:', error)
    throw error
  }
}

export const GET = withErrorHandler(getProductContextHandler)
export const POST = withErrorHandler(postProductContextHandler) 