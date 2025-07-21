'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, User, Download, Search, Lightbulb } from 'lucide-react'
import { Interview } from '@/types/database'

interface SearchResult {
  id: string
  interview_id: string
  chunk_index: number
  content: string
  interview: any | null
  relevance_score: number
  search_type?: 'hybrid' | 'full_text' | 'semantic'
  highlighted_content: string
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true)
      const res = await fetch('/api/interviews')
      const data = await res.json()
      const fetchedInterviews = data.data?.interviews || []
      setInterviews(fetchedInterviews)
      setFilteredInterviews(fetchedInterviews)
      setLoading(false)
    }
    fetchInterviews()
  }, [])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setFilteredInterviews(interviews)
      return
    }

    setSearchLoading(true)
    try {
      const res = await fetch(`/api/search-hybrid?q=${encodeURIComponent(query)}&limit=75`)
      const data = await res.json()
      setSearchResults(data.data?.results || [])
      setFilteredInterviews(data.data?.results || [])
    } catch (error) {
      console.error('Search error:', error)
    }
    setSearchLoading(false)
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSentimentColor = (sentiment: number | string | null | undefined) => {
    if (sentiment === null || sentiment === undefined) return 'text-gray-600 bg-gray-100';
    const value = typeof sentiment === 'string' ? parseFloat(sentiment) : sentiment;
    if (typeof value !== 'number' || isNaN(value)) return 'text-gray-600 bg-gray-100';
    if (value >= 7) return 'text-green-600 bg-green-100';    // positive
    if (value >= 4) return 'text-yellow-600 bg-yellow-100';  // neutral
    return 'text-red-600 bg-red-100';                        // negative
  }

  const getSentimentLabel = (sentiment: number | string | null | undefined) => {
    if (sentiment === null || sentiment === undefined) return 'N/A';
    const value = typeof sentiment === 'string' ? parseFloat(sentiment) : sentiment;
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    if (value <= 4) return 'Negative';
    if (value === 5) return 'Neutral';
    if (value >= 6) return 'Positive';
    return 'N/A';
  };

  // Generate insights based on interview content
  const generateInsights = (interview: Interview) => {
    // First try to use the structured key_insights if available
    if (interview.key_insights) {
      try {
        const structuredInsights = typeof interview.key_insights === 'string' 
          ? JSON.parse(interview.key_insights) 
          : interview.key_insights;
        
        if (Array.isArray(structuredInsights) && structuredInsights.length > 0) {
          return structuredInsights.slice(0, 3);
        }
      } catch (error) {
        console.error('Error parsing key_insights:', error);
      }
    }
    
    // Fallback to generating insights from summary and keywords
    const insights = []
    const summary = interview.summary?.toLowerCase() || ''
    const keywords = Array.isArray(interview.keywords) ? interview.keywords : []
    
    // Look for specific patterns in the summary
    if (summary.includes('ai') || summary.includes('chatgpt') || summary.includes('perplexity')) {
      insights.push('User experimented with AI tools for productivity')
    }
    
    if (summary.includes('vendor') || summary.includes('dependency')) {
      insights.push('Faces challenges with external vendor dependencies')
    }
    
    if (summary.includes('onboarding') || summary.includes('user-friendly')) {
      insights.push('Emphasizes need for better user onboarding')
    }
    
    if (summary.includes('e-commerce') || summary.includes('saas')) {
      insights.push('Background in SaaS transitioning to e-commerce')
    }
    
    // If no specific insights found, provide general ones based on sentiment
    if (insights.length === 0) {
      const sentiment = typeof interview.sentiment === 'number' ? interview.sentiment : 5
      if (sentiment >= 6) {
        insights.push('Generally positive about productivity tools')
      } else if (sentiment <= 4) {
        insights.push('Expressed frustrations with current solutions')
      } else {
        insights.push('Mixed feedback on productivity tools')
      }
    }
    
    return insights.slice(0, 3) // Limit to 3 insights
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Interviews</h1>
          <p className="text-gray-700 max-w-2xl mx-auto font-medium">
            Browse and manage your uploaded user interviews. View details, insights, and recommendations for each interview.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search interviews by participant name, content, or keywords..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value.trim()) {
                  handleSearch(e.target.value)
                } else {
                  setSearchResults([])
                  setFilteredInterviews(interviews)
                }
              }}
            />
          </div>
        </div>

        {/* Search Results or Interviews List */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center text-gray-600 py-12">Loading interviews...</div>
          ) : searchQuery && searchResults.length > 0 ? (
            // Search Results View - Show all results from hybrid search
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-gray-600">
                  Found {searchResults.length} results
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchResults.map((result) => (
                  <div key={result.id} className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
                    <div className="text-sm text-gray-500 mb-1">
                      <span className="font-semibold">Interview:</span> {result.interview?.subject_name || 'Unknown'}
                    </div>
                    <div className="text-gray-800 whitespace-pre-line mb-2">
                      {result.highlighted_content || result.content}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>Chunk #{result.chunk_index}</span>
                      <span>Relevance: {result.relevance_score?.toFixed(2)}</span>
                      <span>Type: {result.search_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery && searchResults.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              No matches found for "{searchQuery}". Try different keywords or check spelling.
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              No interviews found. Upload user interviews to get started.
            </div>
          ) : (
            // Regular Interviews List View
            <div className="space-y-6">
              {filteredInterviews.map((interview) => {
                const insights = generateInsights(interview)
                
                return (
                  <div key={interview.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {interview.subject_name || interview.title || interview.file_name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{interview.subject_name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(interview.interview_date || interview.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{formatFileSize(interview.file_size || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(interview.sentiment)}`}>
                          {getSentimentLabel(interview.sentiment)}
                        </span>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Fit Score</div>
                          <div className="text-lg font-semibold text-blue-600">
                            {typeof interview.pmf_score === 'number' ? `${interview.pmf_score}%` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {interview.summary || interview.content?.substring(0, 200) || 'No summary available.'}
                    </p>

                    {/* Key Quote */}
                    {interview.key_quote && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Quote:</h4>
                        <blockquote className="text-sm text-gray-700 italic leading-relaxed">
                          "{interview.key_quote}"
                        </blockquote>
                      </div>
                    )}

                    {/* Key Insights */}
                    {insights.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                          Key Insights:
                        </h4>
                        <ul className="space-y-1">
                          {insights.map((insight, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-yellow-500 mr-2">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations Section */}
                    {interview.recommendations && (
                      (() => {
                        try {
                          const recommendations = typeof interview.recommendations === 'string' 
                            ? JSON.parse(interview.recommendations) 
                            : interview.recommendations;
                          
                          if (Array.isArray(recommendations) && recommendations.length > 0) {
                            return (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations to Improve PMF:</h4>
                                <ul className="space-y-1">
                                  {recommendations.map((recommendation: string, index: number) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      {recommendation}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                        } catch (error) {
                          console.error('Error parsing recommendations:', error);
                        }
                        return null;
                      })()
                    )}

                    <div className="flex items-center justify-end">
                      {interview.file_path && (
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                          onClick={() => window.open(interview.file_path, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 