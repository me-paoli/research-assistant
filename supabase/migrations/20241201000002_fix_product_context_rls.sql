-- Enable RLS on existing product_context table
ALTER TABLE product_context ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
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

-- Create index for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_product_context_user_id ON product_context(user_id); 