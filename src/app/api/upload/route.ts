import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const participantName = formData.get('participantName') as string
    const interviewDate = formData.get('interviewDate') as string
    const duration = formData.get('duration') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('interviews')
      .upload(`${user.id}/${fileName}`, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Extract text content from file
    let content = ''
    if (file.type === 'text/plain') {
      content = await file.text()
    } else if (file.type === 'application/pdf') {
      // For PDF files, you might want to use a PDF parsing library
      // For now, we'll store the file path and handle text extraction later
      content = `PDF file uploaded: ${fileName}`
    } else {
      content = `File uploaded: ${fileName}`
    }

    // Store interview data in database
    const { data: interviewData, error: dbError } = await supabase
      .from('interviews')
      .insert({
        user_id: user.id,
        title: title || file.name,
        content,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        participant_name: participantName || null,
        interview_date: interviewDate || null,
        duration: duration ? parseInt(duration) : null,
        tags: []
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save interview data' }, { status: 500 })
    }

    // Extract keywords and categories (simplified version)
    const keywords = extractKeywords(content)
    
    // Store keywords
    if (keywords.length > 0) {
      const keywordData = keywords.map(keyword => ({
        user_id: user.id,
        keyword: keyword.text,
        category: keyword.category,
        interview_id: interviewData.id,
        frequency: keyword.frequency
      }))

      await supabase.from('keywords').insert(keywordData)
    }

    return NextResponse.json({
      success: true,
      interview: interviewData,
      keywords: keywords.length
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function extractKeywords(text: string) {
  // Simple keyword extraction - in a real app, you might use NLP libraries
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)

  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  const keywords = Object.entries(wordCount)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, frequency]) => ({
      text: word,
      category: 'general',
      frequency
    }))

  return keywords
} 