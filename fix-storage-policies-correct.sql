-- Fix storage policies using Supabase's storage API functions
-- Run this in Supabase SQL Editor

-- 1. Create policies for interviews bucket using storage API
SELECT storage.create_policy(
  'Allow uploads to interviews bucket',
  'interviews',
  'INSERT',
  'true'
);

SELECT storage.create_policy(
  'Allow downloads from interviews bucket',
  'interviews',
  'SELECT',
  'true'
);

SELECT storage.create_policy(
  'Allow deletes from interviews bucket',
  'interviews',
  'DELETE',
  'true'
);

-- 2. Create policies for research-documents bucket (for backward compatibility)
SELECT storage.create_policy(
  'Allow uploads to research-documents bucket',
  'research-documents',
  'INSERT',
  'true'
);

SELECT storage.create_policy(
  'Allow downloads from research-documents bucket',
  'research-documents',
  'SELECT',
  'true'
);

SELECT storage.create_policy(
  'Allow deletes from research-documents bucket',
  'research-documents',
  'DELETE',
  'true'
);

-- 3. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 