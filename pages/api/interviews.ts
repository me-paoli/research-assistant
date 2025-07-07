import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(200).json({ interviews: data })
} 