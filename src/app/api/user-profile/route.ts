import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { createClient } from '@supabase/supabase-js'

async function getUserProfileHandler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  // Get the current user (using service role key for server-side auth)
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const authHeader = request.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) {
    throw new ValidationError('Not authenticated')
  }

  // Fetch the user's profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // If no profile exists, return null
    if (error.code === 'PGRST116') {
      return createSuccessResponse({ profile: null })
    }
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({ profile: data })
}

async function updateUserProfileHandler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  // Get the current user (using service role key for server-side auth)
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const authHeader = request.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
  if (!user) {
    throw new ValidationError('Not authenticated')
  }

  const body = await request.json()
  const { display_name, organization } = body

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let result
  if (existingProfile) {
    // Update existing profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        display_name: display_name || null,
        organization: organization || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new InternalServerError(error.message)
    }
    result = data
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: user.id,
        display_name: display_name || null,
        organization: organization || null
      }])
      .select()
      .single()

    if (error) {
      throw new InternalServerError(error.message)
    }
    result = data
  }

  return createSuccessResponse({ profile: result })
}

export const GET = withErrorHandler(getUserProfileHandler)
export const POST = withErrorHandler(updateUserProfileHandler) 