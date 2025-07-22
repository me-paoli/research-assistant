import { createClient } from '@supabase/supabase-js'
import env from './env'

export const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Storage bucket names for different document types
export const INTERVIEWS_BUCKET = 'interviews'
export const PRODUCT_DOCUMENTS_BUCKET = 'product-documents'
// DEPRECATED: research-documents bucket is deprecated. Use 'product-documents' or 'interviews' instead. 