import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { StorageService } from '@/lib/storage'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { createClient } from '@supabase/supabase-js'

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
    // Get the current user (using service role key for server-side auth)
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    console.log('[DEBUG] Entered DELETE product documentation route');
    const authHeader = request.headers.get('Authorization');
    console.log('[DEBUG] Auth header:', authHeader);
    const jwt = authHeader?.replace('Bearer ', '');
    console.log('[DEBUG] JWT:', jwt);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    console.log('[DEBUG] Authenticated user:', user);
    console.log('[DEBUG] Auth error:', authError);

    if (!user) {
      throw new ValidationError('Not authenticated');
    }

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
    );

    // Get the product context for this user to find the documentation
    const { data: context, error: fetchError } = await supabaseWithAuth
      .from('product_context')
      .select('id, additional_documents')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('[DEBUG] Product context:', context);
    console.log('[DEBUG] Product context fetch error:', fetchError);

    if (!context) {
      throw new ValidationError('Product context not found');
    }

    const documentationFiles = context.additional_documents || []
    const docToDelete = documentationFiles.find((doc: any) => doc.id === id)

    if (!docToDelete) {
      throw new ValidationError('Documentation not found')
    }

    // Delete from storage
    if (docToDelete.file_path) {
      const { error: storageError } = await StorageService.deleteProductDocument(docToDelete.file_path)
      if (storageError) {
        console.error('[Product Documentation] Failed to delete file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Remove from additional_documents array
    const updatedDocs = documentationFiles.filter((doc: any) => doc.id !== id)

    // Update product context
    const { error: updateError } = await supabaseWithAuth
      .from('product_context')
      .update({ 
        additional_documents: updatedDocs,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.id)
      .eq('user_id', user.id)

    if (updateError) {
      throw new InternalServerError(updateError.message)
    }

    return createSuccessResponse({ success: true })
  } catch (error) {
    throw error
  }
}

export const DELETE = withErrorHandler(deleteProductDocumentationHandler) 