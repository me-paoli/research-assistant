'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, User, Search, Filter } from 'lucide-react'
import { Interview } from '@/types/database'

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setInterviews([
        {
          id: '1',
          user_id: 'mock-user',
          title: 'User Interview with Sarah - Mobile App Experience',
          content: 'Sarah discussed her experience with the mobile app, particularly around the checkout process...',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: [],
          participant_name: 'Sarah',
          interview_date: '2024-01-01',
          file_name: 'interview1.txt',
          file_size: 1234,
          file_type: 'text/plain',
        },
        {
          id: '2',
          user_id: 'mock-user',
          title: 'Product Feedback Session with John',
          content: 'John provided detailed feedback about the new dashboard features and suggested improvements...',
          created_at: '2024-01-14T14:20:00Z',
          updated_at: '2024-01-14T14:20:00Z',
          tags: ['dashboard', 'feedback', 'product'],
          participant_name: 'John',
          interview_date: '2024-01-09',
          file_name: 'john-feedback.docx',
          file_size: 1536000,
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredInterviews = interviews.filter(interview =>
    interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Interviews</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse and manage all your uploaded research interviews. Use the search to find specific interviews quickly.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search interviews by title, participant, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredInterviews.length} of {interviews.length} interviews</span>
              <span>Sorted by date added</span>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="max-w-6xl mx-auto">
          {filteredInterviews.length > 0 ? (
            <div className="space-y-4">
              {filteredInterviews.map((interview) => (
                <div key={interview.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {interview.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{interview.participant_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{interview.interview_date}</span>
                        </div>
                        <div className="text-gray-500">
                          {interview.file_name} • {formatFileSize(interview.file_size || 0)}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {interview.content.substring(0, 200)}...
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {interview.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View
                      </button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Added {formatDate(interview.created_at)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        Download
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No interviews found' : 'No interviews yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start by uploading your first research interview.'
                }
              </p>
              {!searchTerm && (
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Upload Interview
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 