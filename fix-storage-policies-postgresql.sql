-- Fix storage policies using standard PostgreSQL policy syntax
-- Run this in Supabase SQL Editor

-- 1. Create policies for interviews bucket
CREATE POLICY "Allow uploads to interviews bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'interviews');

CREATE POLICY "Allow downloads from interviews bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'interviews');

CREATE POLICY "Allow deletes from interviews bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'interviews');

-- 2. Create policies for research-documents bucket (for backward compatibility)
CREATE POLICY "Allow uploads to research-documents bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'research-documents');

CREATE POLICY "Allow downloads from research-documents bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'research-documents');

CREATE POLICY "Allow deletes from research-documents bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'research-documents');

-- 3. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 