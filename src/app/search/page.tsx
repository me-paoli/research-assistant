'use client'

import { useState } from 'react'
import { Search, Tag, Calendar, User } from 'lucide-react'
import { SearchResult } from '@/types/database'

export default function InterviewSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (res.ok) {
        setResults(data.results || [])
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (err) {
      setError('Search failed')
    }
    setLoading(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Interviews</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Search through your research interviews using keywords to find relevant insights quickly.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search interviews, keywords, or content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              // onKeyPress and search logic to be implemented with real API
            />
            <button
              // onClick logic to be implemented with real API
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-w-4xl mx-auto">
          {loading && <div className="text-gray-500 mb-4">Searching…</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {results.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Search Results ({results.length})
                </h2>
                <div className="text-sm text-gray-600">
                  Sorted by relevance
                </div>
              </div>

              {results.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.name || item.subject_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{item.date || item.interview_date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <span>{Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-600">Fit Score:</span>
                          <span className="text-xs font-semibold text-blue-600">{typeof item.pmf_score === 'number' ? `${item.pmf_score}%` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-600">Sentiment:</span>
                          <span className="text-xs font-semibold">{getSentimentLabel(item.sentiment)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Relevance</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.round(item.relevance_score * 100)}%
                      </div>
                    </div>
                  </div>

                  <div 
                    className="text-gray-700 mb-4 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.summary }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {item.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Full Interview →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No search results yet</h3>
              <p className="text-gray-600">
                Try searching for keywords or participant names to find relevant interviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 