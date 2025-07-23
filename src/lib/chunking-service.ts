import { supabase } from './supabase'
import { OpenAI } from 'openai'
import { chunkByTurns, Chunk } from './chunking'
import env from './env'
import { SupabaseClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[]
  key_points: string[]
}

/**
 * Generate embeddings for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
  return response.data[0].embedding
}

/**
 * Extract key points from a chunk using OpenAI
 */
async function extractKeyPointsFromChunk(text: string): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert user researcher. Read the following interview transcript chunk and extract the most important, surprising, or unique point(s) made by the participant. Return 1-2 concise bullet points as a JSON array of strings. If nothing stands out, return an empty array.`
        },
        {
          role: 'user',
          content: `CHUNK:\n${text}`
        }
      ],
      temperature: 0.2,
      max_tokens: 150
    })
    const responseText = completion.choices[0]?.message?.content || ''
    // Try to parse as JSON array
    const match = responseText.match(/\[[\s\S]*\]/)
    if (match) {
      return JSON.parse(match[0])
    }
    return []
  } catch (error) {
    console.error('[CHUNKING] Failed to extract key points:', error)
    return []
  }
}

/**
 * Process interview transcript into chunks and store with embeddings
 */
export async function processInterviewChunks(
  interviewId: string,
  transcript: string,
  targetTokens = 1400,
  maxTokens = 1700,
  userId?: string,
  supabaseClient?: SupabaseClient
): Promise<{ success: boolean; chunksCount: number; error?: string }> {
  try {
    console.log(`[CHUNKING] Processing interview ${interviewId} into chunks`)
    
    // Use provided client or fallback to default
    const client = supabaseClient || supabase
    
    // Chunk the transcript
    const chunks = chunkByTurns(transcript, targetTokens, maxTokens)
    console.log(`[CHUNKING] Created ${chunks.length} chunks`)
    
    // Generate embeddings for each chunk
    const chunksWithEmbeddings: ChunkWithEmbedding[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`[CHUNKING] Generating embedding for chunk ${i + 1}/${chunks.length}`)
      let embedding: number[] = []
      let keyPoints: string[] = []
      try {
        embedding = await generateEmbedding(chunk.text)
      } catch (error) {
        console.error(`[CHUNKING] Failed to generate embedding for chunk ${i}:`, error)
      }
      try {
        keyPoints = await extractKeyPointsFromChunk(chunk.text)
      } catch (error) {
        console.error(`[CHUNKING] Failed to extract key points for chunk ${i}:`, error)
      }
      chunksWithEmbeddings.push({
        ...chunk,
        embedding,
        key_points: keyPoints
      })
    }
    
    // Store chunks in database
    const chunkRecords = chunksWithEmbeddings.map((chunk, index) => ({
      interview_id: interviewId,
      chunk_index: index,
      clean_text: chunk.text,
      embedding: chunk.embedding,
      key_points: chunk.key_points,
      ...(userId ? { user_id: userId } : {})
    }))
    
    const { error: insertError } = await client
      .from('interview_chunks')
      .insert(chunkRecords)
    
    if (insertError) {
      console.error('[CHUNKING] Failed to insert chunks:', insertError)
      return { success: false, chunksCount: 0, error: insertError.message }
    }
    
    console.log(`[CHUNKING] Successfully stored ${chunksWithEmbeddings.length} chunks for interview ${interviewId}`)
    
    return { 
      success: true, 
      chunksCount: chunksWithEmbeddings.length 
    }
    
  } catch (error) {
    console.error('[CHUNKING] Processing error:', error)
    return { 
      success: false, 
      chunksCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete all chunks for a specific interview
 */
export async function deleteInterviewChunks(interviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('interview_chunks')
      .delete()
      .eq('interview_id', interviewId)
    
    if (error) {
      console.error('[CHUNKING] Failed to delete chunks:', error)
      return { success: false, error: error.message }
    }
    
    console.log(`[CHUNKING] Deleted chunks for interview ${interviewId}`)
    return { success: true }
    
  } catch (error) {
    console.error('[CHUNKING] Delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get chunk statistics for an interview
 */
export async function getInterviewChunkStats(interviewId: string): Promise<{ 
  success: boolean; 
  stats?: { totalChunks: number; totalTokens: number }; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('interview_chunks')
      .select('clean_text')
      .eq('interview_id', interviewId)
    
    if (error) {
      console.error('[CHUNKING] Failed to get chunk stats:', error)
      return { success: false, error: error.message }
    }
    
    const totalChunks = data?.length || 0
    const totalTokens = data?.reduce((sum, chunk) => sum + Math.round(chunk.clean_text.length / 4), 0) || 0
    
    return { 
      success: true, 
      stats: { totalChunks, totalTokens } 
    }
    
  } catch (error) {
    console.error('[CHUNKING] Stats error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 