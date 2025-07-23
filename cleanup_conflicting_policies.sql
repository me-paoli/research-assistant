-- Clean up conflicting policies on interviews table
-- Run this first, then run the complete migration

-- Drop the old "Allow all" policies that are conflicting with our user-specific policies
DROP POLICY IF EXISTS "Allow all interview selects" ON interviews;
DROP POLICY IF EXISTS "Allow all interview inserts" ON interviews;
DROP POLICY IF EXISTS "Allow all interview updates" ON interviews;
DROP POLICY IF EXISTS "Allow all interview deletes" ON interviews;

-- Verify the cleanup worked
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'interviews'
ORDER BY policyname; 