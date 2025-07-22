-- Fix RLS policies to allow anonymous access
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies that require authentication
DROP POLICY IF EXISTS "Allow authenticated interview inserts" ON public.interviews;
DROP POLICY IF EXISTS "Allow authenticated interview selects" ON public.interviews;
DROP POLICY IF EXISTS "Allow authenticated interview updates" ON public.interviews;
DROP POLICY IF EXISTS "Allow authenticated interview deletes" ON public.interviews;

-- 2. Create new policies that allow all users (authenticated and anonymous)
CREATE POLICY "Allow all interview inserts" ON public.interviews
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all interview selects" ON public.interviews
FOR SELECT USING (true);

CREATE POLICY "Allow all interview updates" ON public.interviews
FOR UPDATE USING (true);

CREATE POLICY "Allow all interview deletes" ON public.interviews
FOR DELETE USING (true);

-- 3. Verify the new policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'interviews'; 