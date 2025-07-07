import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
// @ts-expect-error: No types for 'pdf-parse'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

function chunkText(text: string, chunkSize: number = 10000): string[] {
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}

function toISODate(str: string | undefined): string | null {
  if (!str) return null;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  }
  return null;
}

function mergeAIResults(results: unknown[]): Record<string, unknown> {
  // Simple merge: concatenate summaries, merge keywords, average scores
  const allKeywords = results.flatMap(r => {
    const rec = r as Record<string, unknown>;
    return Array.isArray(rec.keywords) ? rec.keywords : [];
  });
  const uniqueKeywords = Array.from(new Set(allKeywords));
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  // Calculate averages and round to nearest integer for int4 columns
  const avgSentiment = avg(results.map(r => {
    const rec = r as Record<string, unknown>;
    return typeof rec.sentiment === 'number' ? rec.sentiment : 0;
  }));
  const avgPmfScore = avg(results.map(r => {
    const rec = r as Record<string, unknown>;
    return typeof rec.fit_score === 'number' ? rec.fit_score : (typeof rec.pmf_score === 'number' ? rec.pmf_score : 0);
  }));
  const first = (results[0] ?? {}) as Record<string, unknown>;
  return {
    subject_name: typeof first.subject_name === 'string' ? first.subject_name : '',
    interview_date: typeof first.interview_date === 'string' ? toISODate(first.interview_date) || null : null,
    summary: results.map(r => {
      const rec = r as Record<string, unknown>;
      return typeof rec.summary === 'string' ? rec.summary : '';
    }).filter(Boolean).join(' ').slice(0, 500),
    keywords: uniqueKeywords,
    sentiment: avgSentiment !== null ? Math.round(avgSentiment) : null,
    pmf_score: avgPmfScore !== null ? Math.round(avgPmfScore) : null,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('OpenAI request timed out')), ms))
  ])
}

async function processChunk(chunk: string, idx: number, total: number): Promise<Record<string, unknown> | null> {
  console.log(`[AI] Processing chunk ${idx + 1} of ${total}`)
  
  // Fetch product context from Supabase
  let productDescription = 'No product description provided.';
  let productUrl = '';
  try {
    const { data: product, error } = await supabase
      .from('product_context')
      .select('*')
      .single();
    if (product && !error) {
      productDescription = product.description || productDescription;
      productUrl = product.url || '';
    }
  } catch (e) {
    // fallback to default
  }

  const prompt = `PRODUCT CONTEXT:\nDescription: ${productDescription}\nURL: ${productUrl}\n\nYou are an expert research analyst specializing in user interview analysis. Your task is to extract structured data from interview transcripts.\n\nCONTEXT:\nThis is chunk ${idx + 1} of ${total} from a user interview transcript. Extract the following information as a JSON object.\n\nREQUIRED OUTPUT FORMAT:\nReturn ONLY a valid JSON object with these exact keys:\n{\n  "subject_name": "string - The name of the person being interviewed",\n  "interview_date": "string - Date of the interview (YYYY-MM-DD format if available, otherwise null)",\n  "summary": "string - A concise 2-3 sentence summary of the main points discussed",\n  "keywords": ["array of strings - Key topics, pain points, or themes mentioned"],\n  "sentiment": "number - Overall sentiment score from 0-10 (0=very negative, 5=neutral, 10=very positive)",\n  "pmf_score": "number - Product-market fit score as a percentage (0-100) based on how well the product solves their problems"\n}\n\nEXTRACTION GUIDELINES:\n- subject_name: Look for introductions, names mentioned, or interviewer references\n- interview_date: Extract any date mentioned, convert to YYYY-MM-DD format\n- summary: Focus on the most important insights, pain points, or feedback shared\n- keywords: Extract 5-10 relevant terms that capture main themes (avoid generic words)\n- sentiment: Consider tone, language, and emotional indicators in the transcript. Return a number from 0-10 (0=very negative, 5=neutral, 10=very positive)\n- pmf_score: Assess how well the discussed product/service addresses the user's needs and return a percentage (0-100, where 100 means perfect fit)\n\nTRANSCRIPT:\n${chunk}\n\nIMPORTANT: Return ONLY the JSON object, no additional text or explanations.`

  try {
    const completion = await withTimeout(openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    }), 60000)
    
    const content = completion.choices[0].message.content || '{}'
    // Clean the response to ensure it's valid JSON
    const cleanedContent = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(cleanedContent)
  } catch (e) {
    console.error(`[AI] Error processing chunk ${idx + 1}:`, e)
    return null
  }
}

async function processChunksWithConcurrency(chunks: string[], concurrency: number): Promise<Record<string, unknown>[]> {
  const results: (Record<string, unknown> | null)[] = [];
  let i = 0;
  while (i < chunks.length) {
    const batch = chunks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((chunk, idx) => processChunk(chunk, i + idx, chunks.length)));
    results.push(...batchResults);
    i += concurrency;
  }
  return results.filter((r): r is Record<string, unknown> => r !== null);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { interviewId } = req.body
    if (!interviewId) {
      res.status(400).json({ error: 'No interviewId provided' })
      return
    }
    // Set status to 'processing' immediately
    await supabase.from('interviews').update({ status: 'processing' }).eq('id', interviewId)
    res.status(200).json({ status: 'processing' })

    // Background processing
    setImmediate(async () => {
      try {
        console.log(`[AI] Processing interview ${interviewId}`)
        // Fetch interview record
        const { data: interview, error: fetchError } = await supabase
          .from('interviews')
          .select('*')
          .eq('id', interviewId)
          .single()
        if (fetchError || !interview) {
          console.error('[AI] Interview not found', fetchError)
          await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
          return
        }
        // Download file from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('research-documents')
          .download(interview.file_path)
        if (downloadError || !fileData) {
          console.error('[AI] Failed to download file', downloadError)
          await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
          return
        }
        // Read file as Buffer
        const buffer = Buffer.from(await fileData.arrayBuffer())
        // Extract text
        let text = ''
        if (interview.file_name.endsWith('.pdf')) {
          text = (await pdfParse(buffer)).text
        } else if (interview.file_name.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ buffer })
          text = result.value
        } else {
          console.error('[AI] Unsupported file type')
          await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
          return
        }
        // Chunk text (10,000 chars)
        const chunks = chunkText(text, 10000)
        console.log(`[AI] Total chunks: ${chunks.length}`)
        // Process chunks with concurrency limit
        const aiResults = await processChunksWithConcurrency(chunks, 3)
        if (!aiResults.length) {
          console.error('[AI] No AI results')
          await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
          return
        }
        const merged = mergeAIResults(aiResults)
        // Update interview record with extracted metadata and set status to 'complete'
        const { error: updateError } = await supabase
          .from('interviews')
          .update({ ...merged, status: 'complete' })
          .eq('id', interviewId)
        if (updateError) {
          console.error('[AI] Failed to update interview status to complete:', updateError)
          await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
          return
        }
        console.log(`[AI] Processing complete for interview ${interviewId}`)
        // Trigger aggregate recommendations update
        try {
          await fetch('http://localhost:3000/api/insights', { method: 'POST' });
          console.log('[AI] Triggered insights aggregation');
        } catch (err) {
          console.error('[AI] Failed to trigger insights aggregation:', err);
        }
      } catch (error) {
        console.error('[AI] Fatal error:', error)
        await supabase.from('interviews').update({ status: 'failed' }).eq('id', interviewId)
      }
    })
  } catch (error) {
    console.error('Process API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 