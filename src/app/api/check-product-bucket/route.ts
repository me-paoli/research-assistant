import { NextRequest, NextResponse } from 'next/server'
import { supabase, PRODUCT_DOCUMENTS_BUCKET } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'

async function checkBucketHandler(request: NextRequest) {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  try {
    // Try to list files in the bucket to see if it exists
    const { data, error } = await supabase.storage
      .from(PRODUCT_DOCUMENTS_BUCKET)
      .list('')

    if (error) {
      console.error('Bucket check error:', error)
      return createSuccessResponse({ 
        bucketExists: false, 
        error: error.message,
        bucketName: PRODUCT_DOCUMENTS_BUCKET
      })
    }

    return createSuccessResponse({ 
      bucketExists: true, 
      fileCount: data.length,
      bucketName: PRODUCT_DOCUMENTS_BUCKET,
      error: ''
    })
  } catch (error) {
    console.error('Bucket check failed:', error)
    return createSuccessResponse({ 
      bucketExists: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      bucketName: PRODUCT_DOCUMENTS_BUCKET
    })
  }
}

export const GET = withErrorHandler(checkBucketHandler) 