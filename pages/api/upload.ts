import type { NextApiRequest, NextApiResponse } from 'next'
import { StorageService } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import formidable, { File as FormidableFile } from 'formidable'
import { promises as fs } from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }) // 10MB
    form.parse(req, (err: any, fields: formidable.Fields, files: formidable.Files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { files } = await parseForm(req)
    const file = files.file as FormidableFile | FormidableFile[]
    if (!file || (Array.isArray(file) && !file[0])) {
      res.status(400).json({ error: 'No file provided' })
      return
    }
    const uploaded = Array.isArray(file) ? file[0] : file
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(uploaded.mimetype || '')) {
      res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX files are allowed.' })
      return
    }
    // Validate file size
    if ((uploaded.size || 0) > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'File too large. Maximum size is 10MB.' })
      return
    }
    // Sanitize and generate unique filename
    const ext = uploaded.originalFilename?.split('.').pop() || 'bin'
    const fileName = `${uuidv4()}_${Date.now()}.${ext}`
    // Read file as Buffer
    const buffer = await fs.readFile(uploaded.filepath)
    // Upload to Supabase storage
    const uploadResult = await StorageService.uploadFile(buffer, fileName, uploaded.mimetype || 'application/octet-stream')
    if (!uploadResult.success) {
      res.status(500).json({ error: uploadResult.error || 'Upload failed' })
      return
    }
    // Insert file metadata into interviews table (no AI metadata yet)
    const { data, error } = await supabase
      .from('interviews')
      .insert([{ file_name: fileName, file_path: uploadResult.filePath, file_size: buffer.length }])
      .select()
      .single()
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ success: true, interview: data })
  } catch (error) {
    console.error('Upload API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 