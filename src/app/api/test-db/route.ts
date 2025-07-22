import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'

async function testDbHandler(request: NextRequest) {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  try {
    // Test basic connection
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('count')
      .limit(1)
    
    if (interviewsError) {
      return createSuccessResponse({ 
        status: 'error', 
        error: interviewsError.message,
        tables: ['interviews table error'],
        functions: [],
        interviewsCount: 0
      })
    }

    // Check if interview_chunks table exists
    const { data: chunks, error: chunksError } = await supabase
      .from('interview_chunks')
      .select('count')
      .limit(1)
    
    const tables = ['interviews']
    if (!chunksError) {
      tables.push('interview_chunks')
    }

    // Check if full-text search functions exist
    let functions = []
    try {
      const { data: ftTest, error: ftError } = await supabase
        .rpc('full_text_search', { query_text: 'test', match_count: 1 })
      
      if (!ftError) {
        functions.push('full_text_search')
      }
    } catch (e) {
      // Function doesn't exist
    }

    try {
      const { data: hybridTest, error: hybridError } = await supabase
        .rpc('hybrid_search', { 
          query_text: 'test', 
          query_embedding: new Array(1536).fill(0), 
          match_count: 1 
        })
      
      if (!hybridError) {
        functions.push('hybrid_search')
      }
    } catch (e) {
      // Function doesn't exist
    }

    return createSuccessResponse({ 
      status: 'success', 
      tables,
      functions,
      interviewsCount: interviews?.length || 0
    })

  } catch (error) {
    console.error('[TEST_DB] Error:', error)
    return createSuccessResponse({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      tables: [],
      functions: [],
      interviewsCount: 0
    })
  }
}

export const GET = withErrorHandler(testDbHandler) 