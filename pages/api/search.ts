import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Missing query' })
    return
  }

  // Full-text search on transcript and keywords (simple ILIKE)
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .or(`transcript.ilike.%${q}%,keywords.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(200).json({ results: data })
} 