import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch the single product context row
    const { data, error } = await supabase
      .from('product_context')
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ productContext: data });
  }
  if (req.method === 'POST') {
    const { name, description, url } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });
    // Upsert (insert or update the single row)
    const { data, error } = await supabase
      .from('product_context')
      .upsert([{ name, description, url }], { onConflict: 'id' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ productContext: data });
  }
  return res.status(405).json({ error: 'Method not allowed' });
} 