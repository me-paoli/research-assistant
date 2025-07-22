-- Fix RLS policies for interviews table
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on interviews table (if not already enabled)
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow authenticated users to insert interview records
CREATE POLICY "Allow authenticated interview inserts" ON public.interviews
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Create policy to allow authenticated users to select interview records
CREATE POLICY "Allow authenticated interview selects" ON public.interviews
FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Create policy to allow authenticated users to update interview records
CREATE POLICY "Allow authenticated interview updates" ON public.interviews
FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Create policy to allow authenticated users to delete interview records
CREATE POLICY "Allow authenticated interview deletes" ON public.interviews
FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'interviews'; 