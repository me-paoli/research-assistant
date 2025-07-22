-- Create new storage buckets for better organization
-- Run this in Supabase SQL Editor

-- 1. Create interviews bucket using storage API
SELECT storage.create_bucket(
  'interviews', -- bucket_id
  false, -- public
  52428800, -- file_size_limit (50MB in bytes)
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ] -- allowed_mime_types
);

-- 2. Create product-documents bucket using storage API
SELECT storage.create_bucket(
  'product-documents', -- bucket_id
  false, -- public
  52428800, -- file_size_limit (50MB in bytes)
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ] -- allowed_mime_types
);

-- 3. Create RLS policies for interviews bucket using storage API
SELECT storage.create_policy(
  'Allow authenticated interview uploads',
  'interviews',
  'INSERT',
  'auth.role() = ''authenticated'''
);

SELECT storage.create_policy(
  'Allow authenticated interview downloads',
  'interviews',
  'SELECT',
  'auth.role() = ''authenticated'''
);

SELECT storage.create_policy(
  'Allow authenticated interview deletes',
  'interviews',
  'DELETE',
  'auth.role() = ''authenticated'''
);

-- 4. Create RLS policies for product-documents bucket using storage API
SELECT storage.create_policy(
  'Allow authenticated product document uploads',
  'product-documents',
  'INSERT',
  'auth.role() = ''authenticated'''
);

SELECT storage.create_policy(
  'Allow authenticated product document downloads',
  'product-documents',
  'SELECT',
  'auth.role() = ''authenticated'''
);

SELECT storage.create_policy(
  'Allow authenticated product document deletes',
  'product-documents',
  'DELETE',
  'auth.role() = ''authenticated'''
);

-- 5. Verify the buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('interviews', 'product-documents'); 