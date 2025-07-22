'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Calendar, User, Download, Search, Lightbulb } from 'lucide-react'
import { Interview } from '@/types/database'
import { FileUploadZone } from '@/components/ui/FileUploadZone'
import { useFileUpload } from '@/hooks/useFileUpload'
import { UploadProgressList } from '@/components/ui/UploadProgressList'
import { Dialog } from '@headlessui/react'

interface SearchResult {
  id: string
  interview_id: string
  chunk_index: number
  content: string
  interview: any | null
  relevance_score: number
  search_type?: 'hybrid' | 'full_text' | 'semantic'
  highlighted_content: string
  full_highlighted_content: string
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [expandedResults, setExpandedResults] = useState<{ [id: string]: boolean }>({})
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  const {
    uploads,
    isUploading,
    uploadFiles,
    removeUpload
  } = useFileUpload()

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

  // Determine upload success and error from uploads array
  const hasUploadSuccess = uploads.some(u => u.status === 'completed')
  const hasUploadError = uploads.some(u => u.status === 'error')
  // Refresh interviews after a new upload is completed and close modal
  useEffect(() => {
    if (hasUploadSuccess) {
      (async () => {
        setLoading(true)
        const res = await fetch('/api/interviews')
        const data = await res.json()
        const fetchedInterviews = data.data?.interviews || []
        setInterviews(fetchedInterviews)
        setFilteredInterviews(fetchedInterviews)
        setLoading(false)
      })()
      setIsUploadModalOpen(false)
    }
  }, [hasUploadSuccess])

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setFilteredInterviews(interviews)
      setSearchResults([])
      setExpandedResults({})
    }
  }, [searchQuery, interviews])

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

  // Detect in-progress uploads
  const hasInProgressUpload = uploads.some(u => u.status === 'uploading' || u.status === 'processing')
  const processingUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'processing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Add proper spacing from navigation */}
      <div className="pt-8">
        <div className="container mx-auto px-4 py-16">
          {/* New Interview Button and Upload Modal */}
          <div className="flex justify-end mb-8">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors"
              onClick={() => setIsUploadModalOpen(true)}
            >
              New Interview
            </button>
          </div>
          
          {/* In-Progress Banner */}
          {hasInProgressUpload && (
            <div className="mb-6 flex items-center justify-center">
              <button
                className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-sm text-sm font-medium hover:bg-blue-200 transition-colors"
                onClick={() => setShowProcessingModal(true)}
                aria-label="Show processing interviews"
              >
                Interview upload/processing in progress…
              </button>
            </div>
          )}
          
          {/* Processing Interviews Modal */}
          <Dialog open={showProcessingModal} onClose={() => setShowProcessingModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
            <div className="flex items-center justify-center min-h-screen px-4">
              <Dialog.Panel className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-6 z-10">
                <Dialog.Title className="text-heading-2 text-gray-900 mb-4">Interviews Processing</Dialog.Title>
                {processingUploads.length > 0 ? (
                  <ul className="divide-y divide-gray-200 mb-4">
                    {processingUploads.map((u, idx) => (
                      <li key={u.id || idx} className="py-3 flex items-center justify-between">
                        <span className="text-gray-800 font-medium">{u.file_name}</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${u.status === 'uploading' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{u.status === 'uploading' ? 'Uploading' : 'Processing'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-600 mb-4">No interviews currently processing.</div>
                )}
                <button
                  className="mt-4 text-blue-600 hover:text-blue-900 text-sm font-medium"
                  onClick={() => setShowProcessingModal(false)}
                >
                  Close
                </button>
              </Dialog.Panel>
            </div>
          </Dialog>
          
          <Dialog open={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
            <div className="flex items-center justify-center min-h-screen px-4">
              <Dialog.Panel className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto p-6 z-10">
                <Dialog.Title className="text-heading-2 text-gray-900 mb-4">Upload New Interview</Dialog.Title>
                <FileUploadZone onDrop={uploadFiles} isUploading={isUploading} />
                <UploadProgressList uploads={uploads} onRemove={removeUpload} />
                {hasUploadError && (
                  <div className="mt-4 text-red-600 text-sm">One or more uploads failed. Please try again.</div>
                )}
                {hasUploadSuccess && (
                  <div className="mt-4 text-green-600 text-sm">Upload successful! Interview will appear below.</div>
                )}
                <button
                  className="mt-6 text-gray-600 hover:text-gray-900 text-sm"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>
              </Dialog.Panel>
            </div>
          </Dialog>
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-display text-gray-900 mb-4">Interviews</h1>
            <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
              Browse and manage your uploaded user interviews. View details, insights, and recommendations for each interview.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search interviews by participant name, content, or keywords..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)
                  if (value.trim().length > 0) {
                    handleSearch(value)
                  } else {
                    setSearchResults([])
                    setFilteredInterviews(interviews)
                    setExpandedResults({})
                  }
                }}
              />
            </div>
          </div>

          {/* Search Results or Interviews List */}
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center text-gray-600 py-12">Loading interviews...</div>
            ) : searchQuery.trim().length > 0 ? (
              searchResults.length > 0 ? (
                // Search Results View
                <div>
                  <div className="mb-8">
                    <h2 className="text-heading-2 text-gray-900 mb-3">
                      Search Results for &quot;{searchQuery}&quot;
                    </h2>
                    <p className="text-body text-gray-600">
                      Found {searchResults.length} results
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map((result) => (
                      <div key={result.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-2">
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-semibold">Interview:</span> {result.interview?.subject_name || 'Unknown'}
                        </div>
                        <div className="text-gray-800 whitespace-pre-line mb-3">
                          {expandedResults[result.id] ? (
                            <span
                              dangerouslySetInnerHTML={{ __html: result.full_highlighted_content }}
                            />
                          ) : (
                            <span
                              dangerouslySetInnerHTML={{ __html: result.highlighted_content }}
                            />
                          )}
                        </div>
                        <button
                          className="text-blue-600 text-xs underline self-start mb-2"
                          onClick={() =>
                            setExpandedResults(prev => ({
                              ...prev,
                              [result.id]: !prev[result.id]
                            }))
                          }
                        >
                          {expandedResults[result.id] ? 'Show less' : 'Show more'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-600 py-12">
                  No matches found for &quot;{searchQuery}&quot;. Try different keywords or check spelling.
                </div>
              )
            ) : (
              filteredInterviews.length === 0 ? (
                <div className="text-center text-gray-600 py-12">
                  No interviews found. Upload user interviews to get started.
                </div>
              ) : (
                // Regular Interviews List View
                <div className="space-y-6">
                  {filteredInterviews
                    .filter(interview => interview.status === 'complete' || interview.status === 'completed')
                    .map((interview) => {
                    const insights = generateInsights(interview)
                    
                    return (
                      <div key={interview.id} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h3 className="text-heading-2 text-gray-900 mb-3">
                              {interview.subject_name || interview.title || interview.file_name}
                            </h3>
                            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{interview.subject_name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(interview.interview_date || interview.created_at)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>{formatFileSize(interview.file_size || 0)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(interview.sentiment)}`}>
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

                        <p className="text-body text-gray-700 mb-6 leading-relaxed">
                          {interview.summary || interview.content?.substring(0, 200) || 'No summary available.'}
                        </p>

                        {/* Key Quote */}
                        {interview.key_quote && (
                          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Key Quote:</h4>
                            <blockquote className="text-sm text-gray-700 italic leading-relaxed">
                              &quot;{interview.key_quote}&quot;
                            </blockquote>
                          </div>
                        )}

                        {/* Key Insights */}
                        {insights.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                              <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                              Key Insights:
                            </h4>
                            <ul className="space-y-2">
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
                                  <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations to Improve PMF:</h4>
                                    <ul className="space-y-2">
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
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors"
                              onClick={() => window.open(interview.file_path, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
          
          {/* Bottom buffer */}
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  )
} 