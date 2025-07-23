-- Complete RLS Migration for Research Assistant
-- Run this in your Supabase SQL editor

-- 1. Enable RLS on interviews table
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can insert their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can update their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can delete their own interviews" ON interviews;

-- Create policies for interviews table
CREATE POLICY "Users can view their own interviews" ON interviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interviews" ON interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews" ON interviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews" ON interviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);

-- 2. Enable RLS on interview_chunks table
ALTER TABLE interview_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own interview chunks" ON interview_chunks;
DROP POLICY IF EXISTS "Users can insert their own interview chunks" ON interview_chunks;
DROP POLICY IF EXISTS "Users can update their own interview chunks" ON interview_chunks;
DROP POLICY IF EXISTS "Users can delete their own interview chunks" ON interview_chunks;

-- Create policies for interview_chunks table
-- Note: interview_chunks should be accessible based on the interview's user_id
CREATE POLICY "Users can view their own interview chunks" ON interview_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_chunks.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interview chunks" ON interview_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_chunks.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interview chunks" ON interview_chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_chunks.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interview chunks" ON interview_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM interviews 
      WHERE interviews.id = interview_chunks.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_chunks_interview_id ON interview_chunks(interview_id);

-- 3. Enable RLS on insights table
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own insights" ON insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON insights;

-- Create policies for insights table
CREATE POLICY "Users can view their own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);

-- 4. Ensure product_context RLS is properly set up (in case it wasn't applied)
ALTER TABLE product_context ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own product context" ON product_context;
DROP POLICY IF EXISTS "Users can insert their own product context" ON product_context;
DROP POLICY IF EXISTS "Users can update their own product context" ON product_context;
DROP POLICY IF EXISTS "Users can delete their own product context" ON product_context;

-- Create policies for product_context table
CREATE POLICY "Users can view their own product context" ON product_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product context" ON product_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product context" ON product_context
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product context" ON product_context
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_context_user_id ON product_context(user_id);

-- 5. Ensure user_profiles RLS is properly set up
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Create policies for user_profiles table
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Verification query to check all policies are in place
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
WHERE tablename IN ('interviews', 'interview_chunks', 'insights', 'product_context', 'user_profiles')
ORDER BY tablename, policyname; 