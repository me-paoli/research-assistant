-- Create product_context table
CREATE TABLE IF NOT EXISTS product_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  url TEXT,
  additional_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_context_user_id ON product_context(user_id);

-- Enable RLS
ALTER TABLE product_context ENABLE ROW LEVEL SECURITY;

-- Create policies for product_context table
CREATE POLICY "Users can view their own product context" ON product_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product context" ON product_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product context" ON product_context
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product context" ON product_context
  FOR DELETE USING (auth.uid() = user_id); 