import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler, ValidationError, InternalServerError } from '@/lib/errors'
import { createSuccessResponse } from '@/lib/errors'
import { SearchResponse } from '@/types/api'
import { extractTextFromPdfBuffer } from '../insights/route';

async function searchHandler(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  if (request.method !== 'GET') {
    throw new ValidationError('Method not allowed')
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    throw new ValidationError('Missing query parameter')
  }

  console.log(`[SEARCH] Searching for: "${query}"`)

  // First, search in the database fields (summary, title, subject_name)
  const { data: dbResults, error: dbError } = await supabase
    .from('interviews')
    .select('*')
    .or(
      `subject_name.ilike.%${query}%,` +
      `summary.ilike.%${query}%,` +
      `title.ilike.%${query}%,` +
      `file_name.ilike.%${query}%`
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (dbError) {
    throw new InternalServerError(dbError.message)
  }

  // Then, search in the actual file content for more comprehensive results
  const searchResults = await Promise.all(
    (dbResults || []).map(async (interview) => {
      let contentMatch = false
      let contentSnippet = ''
      
      try {
        // Download and search the actual file content
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('interviews')
          .download(interview.file_path)
        
        if (!downloadError && fileData) {
          const fileBuffer = await fileData.arrayBuffer()
          const fileName = interview.file_name.toLowerCase()
          
          let fileContent = ''
          
          // Extract text based on file type
          if (fileName.endsWith('.docx')) {
            try {
              const mammoth = (await import('mammoth')).default
              const result = await mammoth.extractRawText({ buffer: Buffer.from(fileBuffer) })
              fileContent = result.value
            } catch (error) {
              fileContent = new TextDecoder().decode(fileBuffer)
            }
          } else if (fileName.endsWith('.pdf')) {
            try {
              fileContent = await extractTextFromPdfBuffer(Buffer.from(fileBuffer));
            } catch (error) {
              fileContent = new TextDecoder().decode(fileBuffer);
            }
          } else {
            fileContent = new TextDecoder().decode(fileBuffer)
          }
          
          // Search in the file content
          const lowerContent = fileContent.toLowerCase()
          const lowerQuery = query.toLowerCase()
          
          if (lowerContent.includes(lowerQuery)) {
            contentMatch = true
            
            // Find ALL matches in the content
            const allMatches = []
            let pos = 0
            while ((pos = lowerContent.indexOf(lowerQuery, pos)) !== -1) {
              const start = Math.max(0, pos - 100)
              const end = Math.min(fileContent.length, pos + query.length + 100)
              const snippet = fileContent.substring(start, end).replace(/\s+/g, ' ').trim()
              if (snippet.toLowerCase().includes(lowerQuery)) {
                allMatches.push({
                  position: pos,
                  snippet: snippet
                })
              }
              pos += 1
            }
            
            // Use the first match that actually contains the search term
            if (allMatches.length > 0) {
              const firstMatch = allMatches[0]
              contentSnippet = firstMatch.snippet
              
              // Add ellipsis if we're not at the beginning/end
              const start = Math.max(0, firstMatch.position - 100)
              const end = Math.min(fileContent.length, firstMatch.position + query.length + 100)
              if (start > 0) contentSnippet = '...' + contentSnippet
              if (end < fileContent.length) contentSnippet = contentSnippet + '...'
              
              console.log(`[SEARCH] Content match found in ${interview.file_name}: "${query}" at position ${firstMatch.position}`)
              console.log(`[SEARCH] Snippet: "${contentSnippet}"`)
            } else {
              // Fallback to original logic if no valid snippets found
              const index = lowerContent.indexOf(lowerQuery)
              const start = Math.max(0, index - 100)
              const end = Math.min(fileContent.length, index + query.length + 100)
              contentSnippet = fileContent.substring(start, end).replace(/\s+/g, ' ').trim()
              
              if (start > 0) contentSnippet = '...' + contentSnippet
              if (end < fileContent.length) contentSnippet = contentSnippet + '...'
              
              console.log(`[SEARCH] Fallback snippet for ${interview.file_name}: "${contentSnippet}"`)
            }
          }
        }
      } catch (error) {
        console.error(`[SEARCH] Error processing file for interview ${interview.id}:`, error)
      }
      
      // Final verification: if contentMatch is true, the snippet must contain the search term
      if (contentMatch && (!contentSnippet || !contentSnippet.toLowerCase().includes(query.toLowerCase()))) {
        console.warn(`[SEARCH] Invalid content match detected for ${interview.file_name}. Marking as summary match instead.`)
        contentMatch = false
        contentSnippet = ''
      }
      
      return {
        ...interview,
        contentMatch,
        contentSnippet,
        relevanceScore: contentMatch ? 2 : 1 // Higher score for content matches
      }
    })
  )

  // Sort by relevance (content matches first, then database matches)
  const sortedResults = searchResults
    .filter(result => result.contentMatch || result.summary?.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      // Sort by relevance score first
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      // Then by creation date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, 20) // Limit to top 20 results

  console.log(`[SEARCH] Found ${sortedResults.length} results for "${query}"`)
  
  return createSuccessResponse({ 
    results: sortedResults,
    query,
    totalResults: sortedResults.length
  })
}

export const GET = withErrorHandler(searchHandler) 