import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { UploadResponse } from '@/types/api'
import { createClient } from '@supabase/supabase-js'


// File validation
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

async function parseFormData(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  
  if (!file) {
    throw new ValidationError('No file provided')
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ValidationError('Invalid file type. Only PDF and DOCX files are allowed.')
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File too large. Maximum size is 10MB.')
  }

  return file
}

async function uploadHandler(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  const file = await parseFormData(request)

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

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${uuidv4()}_${Date.now()}.${ext}`
  const filePath = `${user.id}/${fileName}`

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload to Supabase storage (user folder)
  const uploadResult = await StorageService.uploadInterviewFile(buffer, filePath, file.type)

  if (!uploadResult.success) {
    throw new InternalServerError(uploadResult.error || 'Upload failed')
  }

  // Insert file metadata into interviews table with user_id
  const { data: interview, error } = await supabaseWithAuth
    .from('interviews')
    .insert([{ 
      file_name: fileName, 
      file_path: filePath, 
      file_size: buffer.length,
      status: 'pending',
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({ interview })
}

export const POST = withErrorHandler(uploadHandler) 