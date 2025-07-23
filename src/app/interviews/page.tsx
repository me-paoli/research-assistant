'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Calendar, User, Download, Search, Lightbulb, Plus } from 'lucide-react'
import { Interview } from '@/types/database'
import { FileUploadZone } from '@/components/ui/FileUploadZone'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useInterviews } from '@/hooks/useInterviews'
import { UploadProgressList } from '@/components/ui/UploadProgressList'
import { InterviewCard } from '@/components/ui/InterviewCard'
import { Toast } from '@/components/ui/Toast'
import { Dialog } from '@headlessui/react'
import { supabase } from '@/lib/supabase'

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
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const {
    uploads,
    isUploading,
    uploadFiles,
    removeUpload
  } = useFileUpload()

  // Auto-close modal when uploads start
  useEffect(() => {
    if (uploads.length > 0 && isUploadModalOpen) {
      setIsUploadModalOpen(false)
    }
  }, [uploads.length, isUploadModalOpen])

  const { interviews: fetchedInterviews, loading: isLoading, error, refetch } = useInterviews()

  useEffect(() => {
    if (fetchedInterviews) {
      setInterviews(fetchedInterviews)
      setFilteredInterviews(fetchedInterviews)
      setLoading(false)
    }
  }, [fetchedInterviews])

  // Determine upload success and error from uploads array
  const hasUploadSuccess = uploads.some(u => u.status === 'completed')
  const hasUploadError = uploads.some(u => u.status === 'error')
  // Refresh interviews after a new upload is completed and close modal
  useEffect(() => {
    if (hasUploadSuccess) {
      refetch()
      setIsUploadModalOpen(false)
      
      // Show success toast
      setToast({
        message: 'Interview processing completed! Your interview is now ready for analysis.',
        type: 'success'
      })
    }
  }, [hasUploadSuccess, refetch])

  // Show error toast when upload fails
  useEffect(() => {
    if (hasUploadError) {
      setToast({
        message: 'One or more uploads failed. Please try again.',
        type: 'error'
      })
    }
  }, [hasUploadError])

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
      // Get authentication headers
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers: Record<string, string> = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log('Searching for:', query)
      console.log('Auth token present:', !!token)

      const res = await fetch(`/api/search-hybrid?q=${encodeURIComponent(query)}&limit=75`, {
        headers
      })
      
      console.log('Search response status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Search response error:', errorText)
        throw new Error(`Search failed: ${res.status} - ${errorText}`)
      }
      
      const data = await res.json()
      console.log('Search results:', data)
      setSearchResults(data.data?.results || [])
      setFilteredInterviews(data.data?.results || [])
    } catch (error) {
      console.error('Search error:', error)
      // Fallback to showing all interviews if search fails
      setSearchResults([])
      setFilteredInterviews(interviews)
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

  const getSentimentColor = (pmfScore: number | string | null | undefined) => {
    if (pmfScore === null || pmfScore === undefined) return 'text-gray-600 bg-gray-100';
    const value = typeof pmfScore === 'string' ? parseFloat(pmfScore) : pmfScore;
    if (typeof value !== 'number' || isNaN(value)) return 'text-gray-600 bg-gray-100';
    if (value >= 75) return 'text-green-800 bg-green-100';    // great fit - dark green
    if (value >= 50) return 'text-green-600 bg-green-50';     // potential fit - light green
    if (value === 50) return 'text-yellow-600 bg-yellow-100'; // neutral - yellow
    if (value >= 25) return 'text-red-600 bg-red-50';         // poor fit - light red
    return 'text-red-800 bg-red-100';                         // very poor fit - dark red
  }

  const getSentimentLabel = (pmfScore: number | string | null | undefined) => {
    if (pmfScore === null || pmfScore === undefined) return 'N/A';
    const value = typeof pmfScore === 'string' ? parseFloat(pmfScore) : pmfScore;
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    if (value >= 75) return 'Great fit';
    if (value >= 50) return 'Potential fit';
    if (value === 50) return 'Neutral';
    if (value >= 25) return 'Poor fit';
    return 'Very poor fit';
  };

  // Generate insights based on interview content
  // Helper function to map PMF score ranges to labels
  const getPMFScoreMapping = (pmfScore: number) => {
    if (pmfScore >= 75) return '75-100% (Great fit)';
    if (pmfScore >= 50) return '50-75% (Potential fit)';
    if (pmfScore === 50) return '50% (Neutral)';
    if (pmfScore >= 25) return '25-50% (Poor fit)';
    return '0-25% (Very poor fit)';
  };

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

  const handleDeleteInterview = async (interviewId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers: Record<string, string> = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to delete interview: ${response.status}`)
      }

      // Remove from local state
      setInterviews(prev => prev.filter(i => i.id !== interviewId))
      setFilteredInterviews(prev => prev.filter(i => i.id !== interviewId))
      
      // Show success toast
      setToast({
        message: 'Interview deleted successfully.',
        type: 'success'
      })
    } catch (error) {
      console.error('Error deleting interview:', error)
      setToast({
        message: 'Failed to delete interview. Please try again.',
        type: 'error'
      })
      throw error
    }
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              <span>New Interview</span>
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
                <div className="mt-4 text-sm text-gray-600 text-center">
                  Supported formats: PDF, DOCX
                </div>
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
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
                    <p className="text-gray-600 mb-6">
                      Upload your first user interview to start getting AI-powered insights and recommendations.
                    </p>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Upload Your First Interview
                    </button>
                  </div>
                </div>
              ) : (
                // Regular Interviews List View
                <div className="space-y-6">
                  {filteredInterviews
                    .filter(interview => interview.status === 'complete' || interview.status === 'completed')
                    .map((interview) => {
                    return (
                      <InterviewCard
                        key={interview.id}
                        interview={interview}
                        formatFileSize={formatFileSize}
                        formatDate={formatDate}
                        getSentimentColor={getSentimentColor}
                        getSentimentLabel={getSentimentLabel}
                        generateInsights={generateInsights}
                        onDelete={handleDeleteInterview}
                      />
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
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Upload progress list */}
      <UploadProgressList
        uploads={uploads}
        onRemove={removeUpload}
      />
    </div>
  )
} 