-- Fix storage policies for product-documents bucket using standard PostgreSQL policy syntax
-- Run this in Supabase SQL Editor

-- Create policies for product-documents bucket
CREATE POLICY "Allow uploads to product-documents bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-documents');

CREATE POLICY "Allow downloads from product-documents bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'product-documents');

CREATE POLICY "Allow deletes from product-documents bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'product-documents');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 