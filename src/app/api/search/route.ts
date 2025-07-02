import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SearchResult } from '@/types/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
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

    // Build search query
    let searchQuery = supabase
      .from('interviews')
      .select(`
        *,
        keywords (
          keyword,
          category,
          frequency
        )
      `)
      .eq('user_id', user.id)
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })

    if (category && category !== 'all') {
      searchQuery = searchQuery.eq('keywords.category', category)
    }

    const { data: interviews, error } = await searchQuery
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Process results to include relevance scoring and highlighting
    const results = interviews?.map(interview => {
      const matchedKeywords = interview.keywords?.filter((k: any) => 
        k.keyword.toLowerCase().includes(query.toLowerCase())
      ) || []

      const relevanceScore = calculateRelevanceScore(interview, query, matchedKeywords)
      const highlightedContent = highlightQuery(interview.content, query)

      return {
        interview: {
          id: interview.id,
          title: interview.title,
          content: interview.content,
          participant_name: interview.participant_name,
          interview_date: interview.interview_date,
          created_at: interview.created_at,
          tags: interview.tags
        },
        matched_keywords: matchedKeywords.map((k: any) => k.keyword),
        relevance_score: relevanceScore,
        highlighted_content: highlightedContent
      }
    }) || []

    // Sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score)

    return NextResponse.json({
      results,
      total: results.length,
      query
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateRelevanceScore(interview: any, query: string, matchedKeywords: any[]): number {
  let score = 0

  // Title match (highest weight)
  if (interview.title.toLowerCase().includes(query.toLowerCase())) {
    score += 10
  }

  // Content match
  const contentMatches = (interview.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length
  score += contentMatches * 2

  // Keyword matches
  score += matchedKeywords.length * 5

  // Recency bonus
  const daysSinceCreation = (Date.now() - new Date(interview.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation < 7) score += 3
  else if (daysSinceCreation < 30) score += 1

  return score
}

function highlightQuery(content: string, query: string): string {
  const regex = new RegExp(`(${query})`, 'gi')
  return content.replace(regex, '<mark>$1</mark>')
} 