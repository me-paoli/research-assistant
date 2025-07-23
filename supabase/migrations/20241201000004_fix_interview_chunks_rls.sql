-- Enable RLS on existing interview_chunks table
ALTER TABLE interview_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own interview chunks" ON interview_chunks;
DROP POLICY IF EXISTS "Users can insert their own interview chunks" ON interview_chunks;
DROP POLICY IF EXISTS "Users can update their own interview chunks" ON interview_chunks;
DROP POLICY IF EXISTS "Users can delete their own interview chunks" ON interview_chunks;

-- Create policies for interview_chunks table
-- Note: interview_chunks should be accessible based on the interview's user_id
-- We'll use a join with interviews table to check user_id
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

-- Create index for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_interview_chunks_interview_id ON interview_chunks(interview_id); 