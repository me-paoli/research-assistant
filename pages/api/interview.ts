import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'No id provided' })
      return
    }
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) {
      res.status(404).json({ error: 'Interview not found' })
      return
    }
    res.status(200).json({ interview: data })
  } else if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'No id provided' })
      return
    }
    // Fetch interview to get file path
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError || !interview) {
      res.status(404).json({ error: 'Interview not found' })
      return
    }
    // Delete file from storage
    if (interview.file_path) {
      await supabase.storage.from('research-documents').remove([interview.file_path])
    }
    // Delete interview record
    const { error: deleteError } = await supabase
      .from('interviews')
      .delete()
      .eq('id', id)
    if (deleteError) {
      res.status(500).json({ error: deleteError.message })
      return
    }
    res.status(200).json({ success: true })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 