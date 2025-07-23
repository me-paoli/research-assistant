import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { InsightsResponse } from '@/types/api'
import env from '@/lib/env'
import mammoth from 'mammoth'
import { extractTextFromPdfBuffer } from '@/lib/pdf-extraction'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

async function getAllRecommendations(supabaseWithAuth: any): Promise<string[]> {
  const { data, error } = await supabaseWithAuth
    .from('interviews')
    .select('summary, keywords, sentiment, pmf_score')
    .not('summary', 'is', null)

  if (error) {
    console.error('Error fetching interviews for recommendations:', error)
    return []
  }

  const recommendations: string[] = []
  
  data?.forEach((interview: any) => {
    if (interview.summary) {
      recommendations.push(interview.summary)
    }
    if (interview.keywords && Array.isArray(interview.keywords)) {
      recommendations.push(interview.keywords.join(', '))
    }
  })

  return recommendations
}

async function getAllSummariesAndInsights(supabaseWithAuth: any): Promise<{ summaries: string[]; keyInsights: string[] }> {
  const { data, error } = await supabaseWithAuth
    .from('interviews')
    .select('summary, key_insights')
    .not('summary', 'is', null)

  if (error) {
    console.error('Error fetching interviews for summaries/insights:', error)
    return { summaries: [], keyInsights: [] }
  }

  const summaries: string[] = []
  const keyInsights: string[] = []

  data?.forEach((interview: any) => {
    if (interview.summary) {
      summaries.push(interview.summary)
    }
    if (interview.key_insights) {
      try {
        const insights = Array.isArray(interview.key_insights)
          ? interview.key_insights
          : JSON.parse(interview.key_insights)
        if (Array.isArray(insights)) {
          keyInsights.push(...insights)
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  })

  return { summaries, keyInsights }
}

async function getAllChunkKeyPoints(supabaseWithAuth: any): Promise<string[]> {
  const { data, error } = await supabaseWithAuth
    .from('interview_chunks')
    .select('key_points')
    .not('key_points', 'is', null)

  if (error) {
    console.error('Error fetching chunk key points:', error)
    return []
  }

  const keyPoints: string[] = []
  data?.forEach((chunk: any) => {
    if (chunk.key_points) {
      try {
        const points = Array.isArray(chunk.key_points)
          ? chunk.key_points
          : JSON.parse(chunk.key_points)
        if (Array.isArray(points)) {
          keyPoints.push(...points)
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  })
  return keyPoints
}

async function getAggregateInsightsWithOpenAI({ summaries, keyInsights, chunkKeyPoints }: { summaries: string[]; keyInsights: string[]; chunkKeyPoints: string[] }, warnings: string[], supabaseWithAuth: any): Promise<any> {
  // Get product context and documentation
  let productContext = ''
  let productDocumentation = ''
  try {
    const { data: product } = await supabaseWithAuth
      .from('product_context')
      .select('name, description, url, additional_documents')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (product) {
      productContext = `PRODUCT: ${product.name || 'Unknown'}\nDESCRIPTION: ${product.description || 'No description'}\nURL: ${product.url || 'No URL'}\n\n`
      if (product.additional_documents && product.additional_documents.length > 0) {
        const docsText = await Promise.all(
          product.additional_documents.map(async (doc: any) => {
            try {
              // Download file from storage directly by full path
              const { data: fileData, error: downloadError } = await supabaseWithAuth.storage
                .from('product-documents')
                .download(doc.file_path)
              if (downloadError || !fileData) {
                warnings.push(`Could not download documentation file: ${doc.file_name} (${doc.file_path})`)
                return ''
              }
              // Read file as Buffer
              const buffer = Buffer.from(await fileData.arrayBuffer())
              let text = ''
              try {
                if (doc.file_type === 'application/pdf') {
                  text = await extractTextFromPdfBuffer(buffer)
                } else if (doc.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  const result = await mammoth.extractRawText({ buffer })
                  text = result.value
                } else {
                  text = buffer.toString('utf-8')
                }
              } catch (parseError) {
                warnings.push(`Could not extract text from documentation file: ${doc.file_name} (${doc.file_path})`)
                return ''
              }
              return `${doc.name}:
${text}`
            } catch (error) {
              warnings.push(`Error processing documentation file: ${doc.file_name} (${doc.file_path})`)
              return ''
            }
          })
        )
        const validDocs = docsText.filter(text => text.length > 0)
        if (validDocs.length > 0) {
          productDocumentation = `\n\nPRODUCT DOCUMENTATION:\n${validDocs.join('\n\n')}\n\n`
        }
      }
    }
  } catch (error) {
    warnings.push('Error fetching product context or documentation.')
    console.error('Error fetching product context:', error)
  }

  const prompt = `You are an expert product manager analyzing user research data. Based on the following interview summaries, key insights, and important points from transcripts, generate a JSON object with these keys: trends (recurring points), surprises (unique or unexpected feedback), and recommendations (3-5 actionable suggestions to improve the product).\n\n${productContext}${productDocumentation}INTERVIEW SUMMARIES:\n${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nKEY INSIGHTS:\n${keyInsights.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\nIMPORTANT/UNIQUE POINTS FROM TRANSCRIPTS:\n${chunkKeyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nTASK:\n1. Identify the most important and recurring points across all interviews.\n2. Highlight any surprising or unique feedback.\n3. Provide 3–5 actionable recommendations for improving the product.\n\nRespond ONLY with a valid JSON object with keys: trends, surprises, recommendations. Do not include any explanation, markdown, or prose. If you cannot answer, return an empty JSON object {}`;

  // Truncate content if it's too long to prevent token limit issues
  const maxPromptLength = 80000; // ~20k tokens
  let finalPrompt = prompt;
  
  if (prompt.length > maxPromptLength) {
    console.log(`[INSIGHTS] Prompt too long (${prompt.length} chars), truncating to ${maxPromptLength} chars`);
    finalPrompt = prompt.substring(0, maxPromptLength) + '\n\n[TRUNCATED - Content was too long for analysis]';
  }
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a JSON-only generator. You must respond ONLY with a valid JSON object, no explanation, no markdown, no prose.' },
      { role: 'user', content: finalPrompt }
    ],
    temperature: 0.2,
    max_tokens: 800,
  })

  try {
    const content = completion.choices[0].message.content || '{}'
    const cleanedContent = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
    const json = JSON.parse(cleanedContent)
    return json
  } catch (error) {
    warnings.push('Error parsing OpenAI response for aggregate insights.')
    console.error('Error parsing aggregate insights JSON:', error)
    return {}
  }
}

async function getInsightsHandler(request: NextRequest): Promise<NextResponse<InsightsResponse>> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  // Get the current user (using anon key for JWT validation)
  const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const authHeader = request.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')
  
  if (!jwt) {
    throw new ValidationError('No authentication token provided')
  }
  
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
  if (!user || authError) {
    throw new ValidationError('Not authenticated')
  }

  // Create a Supabase client with the user's JWT for database operations
  const supabaseWithAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    }
  )

  // Return the latest insights row for this user
  const { data, error } = await supabaseWithAuth
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new InternalServerError(error.message)
  }

  return createSuccessResponse({
    insights: data?.insights || null,
    warnings: data?.warnings || []
  })
}

async function postInsightsHandler(request: NextRequest): Promise<NextResponse<InsightsResponse>> {
  if (request.method !== 'POST') {
    throw new ValidationError('Method not allowed')
  }

  // Get the current user (using anon key for JWT validation)
  const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const authHeader = request.headers.get('Authorization')
  const jwt = authHeader?.replace('Bearer ', '')
  
  if (!jwt) {
    throw new ValidationError('No authentication token provided')
  }
  
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
  if (!user || authError) {
    throw new ValidationError('Not authenticated')
  }

  // Create a Supabase client with the user's JWT for database operations
  const supabaseWithAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    }
  )

  try {
    const warnings: string[] = []
    const { summaries, keyInsights } = await getAllSummariesAndInsights(supabaseWithAuth)
    const chunkKeyPoints = await getAllChunkKeyPoints(supabaseWithAuth)
    const aggregateInsights = await getAggregateInsightsWithOpenAI({ summaries, keyInsights, chunkKeyPoints }, warnings, supabaseWithAuth)
    // Store in insights table for this user
    const { data, error } = await supabaseWithAuth
      .from('insights')
      .insert([{ insights: aggregateInsights, warnings, updated_at: new Date().toISOString(), user_id: user.id }])
      .select()
      .single()

    if (error) {
      throw new InternalServerError(error.message)
    }

    return createSuccessResponse({ insights: data?.insights, warnings: data?.warnings || [] })
  } catch (error) {
    throw new InternalServerError(error instanceof Error ? error.message : 'Unknown error')
  }
}

// Normalization helper
function normalize(text: string) {
  return text
    .replace(/\r/g,'')
    .replace(/\u00A0/g,' ')
    .replace(/[ \t]+/g,' ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

export const GET = withErrorHandler(getInsightsHandler)
export const POST = withErrorHandler(postInsightsHandler) 