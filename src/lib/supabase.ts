import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket names for different document types
export const INTERVIEWS_BUCKET = 'interviews'
export const PRODUCT_DOCUMENTS_BUCKET = 'product-documents'
// DEPRECATED: research-documents bucket is deprecated. Use 'product-documents' or 'interviews' instead. 