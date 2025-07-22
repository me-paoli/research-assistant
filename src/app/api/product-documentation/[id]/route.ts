import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { StorageService } from '@/lib/storage'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'

async function deleteProductDocumentationHandler(
  request: NextRequest
): Promise<NextResponse> {
  if (request.method !== 'DELETE') {
    throw new ValidationError('Method not allowed')
  }

  const id = request.nextUrl.pathname.split('/').pop()

  if (!id) {
    throw new ValidationError('Documentation ID is required')
  }

  try {
    // Get the product context to find the documentation
    const { data: context, error: fetchError } = await supabase
      .from('product_context')
      .select('id, additional_documents')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !context) {
      throw new ValidationError('Product context not found')
    }

    const documentationFiles = context.additional_documents || []
    const docToDelete = documentationFiles.find((doc: any) => doc.id === id)

    if (!docToDelete) {
      throw new ValidationError('Documentation not found')
    }

    // Delete from storage
    if (docToDelete.file_path) {
      const { error: storageError } = await StorageService.deleteFile(docToDelete.file_path)
      if (storageError) {
        console.error('[Product Documentation] Failed to delete file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Remove from additional_documents array
    const updatedDocs = documentationFiles.filter((doc: any) => doc.id !== id)

    // Update product context
    const { error: updateError } = await supabase
      .from('product_context')
      .update({ 
        additional_documents: updatedDocs,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.id)

    if (updateError) {
      throw new InternalServerError(updateError.message)
    }

    return createSuccessResponse({ success: true })
  } catch (error) {
    throw error
  }
}

export const DELETE = withErrorHandler(deleteProductDocumentationHandler) 