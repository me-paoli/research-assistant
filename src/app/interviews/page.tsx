'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, User, Tag, Eye, Download } from 'lucide-react'

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInterviews() {
      setLoading(true)
      const res = await fetch('/api/interviews')
      const data = await res.json()
      setInterviews(data.interviews || [])
      setLoading(false)
    }
    fetchInterviews()
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Interviews</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse and manage your uploaded research interviews. View details, tags, and insights for each interview.
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : interviews.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : interviews.filter(i => {
                    const d = i.created_at ? new Date(i.created_at) : null
                    return d && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear()
                  }).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Tag className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Keywords</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : interviews.flatMap(i => i.keywords || []).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <User className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participants</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : new Set(interviews.map(i => i.subject_name).filter(Boolean)).size}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No interviews found. Upload a document to get started.</div>
          ) : (
          <div className="space-y-6">
            {interviews.map((interview) => (
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

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(interview.keywords || []).map((keyword: string) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
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
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
} 