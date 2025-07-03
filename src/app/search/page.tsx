'use client'

import { useState } from 'react'
import { Search, Filter, Tag, Calendar, User } from 'lucide-react'
import { SearchResult } from '@/types/database'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  // Mock data for demonstration
  const categories = [
    { id: 'all', name: 'All Categories', color: 'gray' },
    { id: 'user-experience', name: 'User Experience', color: 'blue' },
    { id: 'product-feedback', name: 'Product Feedback', color: 'green' },
    { id: 'pain-points', name: 'Pain Points', color: 'red' },
    { id: 'feature-requests', name: 'Feature Requests', color: 'purple' }
  ]

  const tags = [
    'mobile', 'desktop', 'onboarding', 'checkout', 'navigation', 
    'performance', 'design', 'accessibility', 'pricing', 'support'
  ]

  const handleSearch = () => {
    // Mock search results
    const mockResults: SearchResult[] = [
      {
        interview: {
          id: '1',
          title: 'User Interview with Sarah - Mobile App Experience',
          content: 'Sarah discussed her experience with the mobile app, particularly around the checkout process...',
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
          tags: ['mobile', 'checkout', 'user-experience'],
          participant_name: 'Sarah',
          interview_date: '2024-01-10'
        },
        matched_keywords: ['mobile', 'checkout', 'user experience'],
        relevance_score: 0.95,
        highlighted_content: 'Sarah discussed her <mark>experience</mark> with the <mark>mobile</mark> app, particularly around the <mark>checkout</mark> process...'
      }
    ]
    setSearchResults(mockResults)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Interviews</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Search through your research interviews using keywords, categories, and tags to find relevant insights quickly.
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
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-w-4xl mx-auto">
          {searchResults.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Search Results ({searchResults.length})
                </h2>
                <div className="text-sm text-gray-600">
                  Sorted by relevance
                </div>
              </div>

              {searchResults.map((result) => (
                <div key={result.interview.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {result.interview.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{result.interview.participant_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{result.interview.interview_date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <span>{result.matched_keywords.length} matches</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Relevance</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.round(result.relevance_score * 100)}%
                      </div>
                    </div>
                  </div>

                  <div 
                    className="text-gray-700 mb-4 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: result.highlighted_content }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {result.interview.tags.map((tag) => (
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
                Try searching for keywords, categories, or participant names to find relevant interviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 