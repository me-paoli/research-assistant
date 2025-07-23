import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { StorageService } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { ProductDocumentationResponse, ProductDocumentationListResponse } from '@/types/api'
import { createClient } from '@supabase/supabase-js'

// File validation - same as interview uploads
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

async function parseFormData(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null
  const description = formData.get('description') as string | null
  
  if (!file) {
    throw new ValidationError('No file provided')
  }

  if (!name) {
    throw new ValidationError('Document name is required')
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ValidationError('Invalid file type. Only PDF and DOCX files are allowed.')
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File too large. Maximum size is 10MB.')
  }

  return { file, name, description }
}

async function getProductDocumentationHandler(request: NextRequest): Promise<NextResponse<ProductDocumentationListResponse>> {
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

  // Fetch product context for this user and return documentation metadata
  const { data, error } = await supabaseWithAuth
    .from('product_context')
    .select('additional_documents')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // If no product context exists, return empty array
    if (error.code === 'PGRST116') {
      return createSuccessResponse({ documentation: [] })
    }
    throw new InternalServerError(error.message)
  }

  // Return documentation files if they exist
  const documentationFiles = data.additional_documents || []
  return createSuccessResponse({ documentation: documentationFiles })
}

async function postProductDocumentationHandler(request: NextRequest): Promise<NextResponse<ProductDocumentationResponse>> {
  if (request.method !== 'POST') {
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

  const { file, name, description } = await parseFormData(request)

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${uuidv4()}_${Date.now()}.${ext}`
  const filePath = `${user.id}/${fileName}`

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    // Upload to Supabase storage using StorageService (user folder)
    const uploadResult = await StorageService.uploadProductDocument(buffer, filePath, file.type)
    
    if (!uploadResult.success) {
      throw new InternalServerError(uploadResult.error || 'Upload failed')
    }

    // Create new documentation entry
    const newDoc = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      file_path: uploadResult.filePath!,
      file_name: file.name,
      file_size: buffer.length,
      file_type: file.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id
    }

    // Get existing product context for this user
    const { data: existingContext, error: fetchError } = await supabaseWithAuth
      .from('product_context')
      .select('id, additional_documents')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let existingDocs = []
    
    if (existingContext && !fetchError) {
      existingDocs = existingContext.additional_documents || []
    }

    // Add new documentation to the array
    const updatedDocs = [newDoc, ...existingDocs]

    if (existingContext) {
      // Update existing product context
      const { data, error: updateError } = await supabaseWithAuth
        .from('product_context')
        .update({ 
          additional_documents: updatedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContext.id)
        .select()
        .single()

      if (updateError) {
        // Clean up uploaded file if database update fails
        await StorageService.deleteProductDocument(uploadResult.filePath!)
        throw new InternalServerError(updateError.message)
      }

      return createSuccessResponse({ documentation: newDoc })
    } else {
      // Create new product context with documentation
      const { data, error: insertError } = await supabaseWithAuth
        .from('product_context')
        .insert([{ 
          name: 'Default Product',
          description: 'Product with uploaded documentation',
          url: '',
          additional_documents: [newDoc],
          user_id: user.id
        }])
        .select()
        .single()

      if (insertError) {
        // Clean up uploaded file if database insert fails
        await StorageService.deleteProductDocument(uploadResult.filePath!)
        throw new InternalServerError(insertError.message)
      }

      return createSuccessResponse({ documentation: newDoc })
    }
  } catch (error) {
    console.error('[Product Documentation] Upload error:', error)
    throw error
  }
}

export const GET = withErrorHandler(getProductDocumentationHandler)
export const POST = withErrorHandler(postProductDocumentationHandler) 