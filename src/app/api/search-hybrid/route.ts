import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { HybridSearchResponse } from '@/types/api'
import env from '@/lib/env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

interface SearchResult {
  id: string
  doc_id: string
  chunk_index: number
  clean_text: string
  embedding: number[]
  relevance_score?: number
  search_type?: 'hybrid' | 'full_text' | 'semantic'
}

function highlightTerm(text: string, term: string) {
  if (!term) return text;
  // Escape special regex characters in the term
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function getSnippetWithTerm(text: string, term: string, snippetLength = 200) {
  if (!term) return text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : '');
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const idx = lowerText.indexOf(lowerTerm);
  if (idx === -1) {
    // Term not found, fallback to start
    return highlightTerm(text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : ''), term);
  }
  // Center the snippet around the first match
  const start = Math.max(0, idx - Math.floor((snippetLength - term.length) / 2));
  let end = start + snippetLength;
  if (end > text.length) {
    end = text.length;
  }
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return highlightTerm(snippet, term);
}

async function hybridSearchHandler(request: NextRequest): Promise<NextResponse<HybridSearchResponse>> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const searchType = searchParams.get('type') || 'hybrid' // hybrid, full_text, semantic
  const limit = parseInt(searchParams.get('limit') || '75')

  if (!query) {
    throw new ValidationError('Missing query parameter')
  }

  console.log(`[HYBRID_SEARCH] Searching for: "${query}" with type: ${searchType}`)

  try {
    let searchResults: SearchResult[] = []

    if (searchType === 'full_text') {
      // Full-text search only
      const { data, error } = await supabase
        .rpc('full_text_search', {
          query_text: query,
          match_count: limit
        })

      if (error) {
        console.error('[HYBRID_SEARCH] Full-text search error:', error)
        throw new InternalServerError(error.message)
      }

      searchResults = (data || []).map((result: any) => ({
        ...result,
        search_type: 'full_text' as const
      }))

    } else if (searchType === 'semantic') {
      // Semantic search only - need to generate embedding first
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query
      })

      const queryEmbedding = embeddingResponse.data[0].embedding

      const { data, error } = await supabase
        .rpc('semantic_search', {
          query_embedding: queryEmbedding,
          match_count: limit
        })

      if (error) {
        console.error('[HYBRID_SEARCH] Semantic search error:', error)
        throw new InternalServerError(error.message)
      }

      searchResults = (data || []).map((result: any) => ({
        ...result,
        search_type: 'semantic' as const
      }))

    } else {
      // Hybrid search - combine full-text and semantic
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query
      })

      const queryEmbedding = embeddingResponse.data[0].embedding

      const { data, error } = await supabase
        .rpc('hybrid_search', {
          query_text: query,
          query_embedding: queryEmbedding,
          match_count: limit,
          ft_weight: 1.0,
          sem_weight: 1.0,
          rrf_k: 50
        })

      if (error) {
        console.error('[HYBRID_SEARCH] Hybrid search error:', error)
        throw new InternalServerError(error.message)
      }

      searchResults = (data || []).map((result: any) => ({
        ...result,
        search_type: 'hybrid' as const
      }))
    }

    // Get interview metadata for each chunk
    const docIds = [...new Set(searchResults.map(r => r.doc_id))]
    const { data: interviews, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .in('id', docIds)

    if (interviewError) {
      console.error('[HYBRID_SEARCH] Error fetching interviews:', interviewError)
      throw new InternalServerError(interviewError.message)
    }

    const interviewMap = new Map(interviews?.map(i => [i.id, i]) || [])

    // Format results for the frontend
    const formattedResults = searchResults.map((chunk, index) => {
      const interview = interviewMap.get(chunk.doc_id)
      return {
        id: chunk.id,
        interview_id: chunk.doc_id,
        chunk_index: chunk.chunk_index,
        content: chunk.clean_text,
        interview: interview || null,
        relevance_score: chunk.relevance_score || (searchResults.length - index),
        search_type: chunk.search_type,
        highlighted_content: getSnippetWithTerm(chunk.clean_text, query),
        full_highlighted_content: highlightTerm(chunk.clean_text, query)
      }
    })

    console.log(`[HYBRID_SEARCH] Found ${formattedResults.length} results for "${query}"`)

    return createSuccessResponse({
      results: formattedResults,
      query,
      totalResults: formattedResults.length,
      searchType
    })

  } catch (error) {
    console.error('[HYBRID_SEARCH] Search error:', error)
    throw new InternalServerError(error instanceof Error ? error.message : 'Search failed')
  }
}

export const GET = withErrorHandler(hybridSearchHandler)