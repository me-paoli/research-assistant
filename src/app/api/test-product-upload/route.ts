import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/storage'
import { supabase, PRODUCT_DOCUMENTS_BUCKET } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'

async function testProductUploadHandler(request: NextRequest) {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  try {
    // Create a test file
    const testContent = "This is a test product document for debugging uploads."
    const buffer = Buffer.from(testContent, 'utf-8')
    const fileName = `test-product-doc-${Date.now()}.txt`
    
    console.log(`[TEST] Attempting to upload to bucket: ${PRODUCT_DOCUMENTS_BUCKET}`)
    
    // Test upload to product-documents bucket
    const uploadResult = await StorageService.uploadProductDocument(buffer, fileName, 'text/plain')
    
    console.log(`[TEST] Upload result:`, uploadResult)
    
    if (!uploadResult.success) {
      return createSuccessResponse({ 
        success: false, 
        error: uploadResult.error,
        bucket: PRODUCT_DOCUMENTS_BUCKET
      })
    }

    // Test listing files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(PRODUCT_DOCUMENTS_BUCKET)
      .list('')

    console.log(`[TEST] List result:`, { files, error: listError })

    return createSuccessResponse({ 
      success: true, 
      uploadResult,
      bucket: PRODUCT_DOCUMENTS_BUCKET,
      filesInBucket: files?.length || 0,
      listError: listError?.message,
      error: ''
    })
  } catch (error) {
    console.error('[TEST] Product upload test failed:', error)
    return createSuccessResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket: PRODUCT_DOCUMENTS_BUCKET
    })
  }
}

export const POST = withErrorHandler(testProductUploadHandler) 