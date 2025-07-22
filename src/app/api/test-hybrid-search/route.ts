import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import { withErrorHandler, ValidationError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import env from '@/lib/env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

async function testHybridSearchHandler(request: NextRequest) {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'test'

  try {
    console.log(`[TEST_HYBRID] Testing search for: "${query}"`)

    // Test full-text search
    let fullTextResults = []
    try {
      const { data: ftData, error: ftError } = await supabase
        .rpc('full_text_search', {
          query_text: query,
          match_count: 5
        })
      
      if (!ftError && ftData) {
        fullTextResults = ftData
        console.log(`[TEST_HYBRID] Full-text search found ${ftData.length} results`)
      } else {
        console.error('[TEST_HYBRID] Full-text search error:', ftError)
      }
    } catch (error) {
      console.error('[TEST_HYBRID] Full-text search failed:', error)
    }

    // Test semantic search
    let semanticResults = []
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query
      })

      const queryEmbedding = embeddingResponse.data[0].embedding

      const { data: semData, error: semError } = await supabase
        .rpc('semantic_search', {
          query_embedding: queryEmbedding,
          match_count: 5
        })
      
      if (!semError && semData) {
        semanticResults = semData
        console.log(`[TEST_HYBRID] Semantic search found ${semData.length} results`)
      } else {
        console.error('[TEST_HYBRID] Semantic search error:', semError)
      }
    } catch (error) {
      console.error('[TEST_HYBRID] Semantic search failed:', error)
    }

    // Test hybrid search
    let hybridResults = []
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query
      })

      const queryEmbedding = embeddingResponse.data[0].embedding

      const { data: hybData, error: hybError } = await supabase
        .rpc('hybrid_search', {
          query_text: query,
          query_embedding: queryEmbedding,
          match_count: 5
        })
      
      if (!hybError && hybData) {
        hybridResults = hybData
        console.log(`[TEST_HYBRID] Hybrid search found ${hybData.length} results`)
      } else {
        console.error('[TEST_HYBRID] Hybrid search error:', hybError)
      }
    } catch (error) {
      console.error('[TEST_HYBRID] Hybrid search failed:', error)
    }

    return createSuccessResponse({
      query,
      fullTextResults: fullTextResults.length,
      semanticResults: semanticResults.length,
      hybridResults: hybridResults.length,
      functions: {
        fullText: fullTextResults.length > 0,
        semantic: semanticResults.length > 0,
        hybrid: hybridResults.length > 0
      }
    })

  } catch (error) {
    console.error('[TEST_HYBRID] Error:', error)
    return createSuccessResponse({
      query,
      error: error instanceof Error ? error.message : 'Unknown error',
      fullTextResults: 0,
      semanticResults: 0,
      hybridResults: 0,
      functions: {
        fullText: false,
        semantic: false,
        hybrid: false
      }
    })
  }
}

export const GET = withErrorHandler(testHybridSearchHandler) 