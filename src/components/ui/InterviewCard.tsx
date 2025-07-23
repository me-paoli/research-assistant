'use client'

import { useState } from 'react'
import { FileText, Calendar, User, Download, ChevronDown, ChevronUp, Lightbulb, Trash2 } from 'lucide-react'
import { Interview } from '@/types/database'
import { useAuthContext } from '@/context/AuthContext'

interface InterviewCardProps {
  interview: Interview
  formatFileSize: (bytes: number) => string
  formatDate: (dateString: string) => string
  getSentimentColor: (sentiment: number | string | null | undefined) => string
  getSentimentLabel: (sentiment: number | string | null | undefined) => string
  generateInsights: (interview: Interview) => string[]
  onDelete?: (interviewId: string) => Promise<void>
}

export function InterviewCard({
  interview,
  formatFileSize,
  formatDate,
  getSentimentColor,
  getSentimentLabel,
  generateInsights,
  onDelete
}: InterviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuthContext()
  const insights = generateInsights(interview)

  const handleDelete = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-login-modal'))
      return
    }
    if (!onDelete || isDeleting) return
    
    if (confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      setIsDeleting(true)
      try {
        await onDelete(interview.id)
      } catch (error) {
        console.error('Error deleting interview:', error)
        alert('Failed to delete interview. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header - Always visible */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {interview.subject_name || interview.title || interview.file_name}
            </h3>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
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
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(interview.pmf_score)}`}>
              {getSentimentLabel(interview.pmf_score)}
            </span>
            <div className="text-right">
              <div className="text-sm text-gray-600">Fit Score</div>
              <div className="text-lg font-semibold text-blue-600">
                {typeof interview.pmf_score === 'number' ? `${interview.pmf_score}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Summary - Always visible */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {interview.summary || interview.content?.substring(0, 200) || 'No summary available.'}
        </p>

        {/* Expand/Collapse button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>{isExpanded ? 'Show less' : 'Show more'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center space-x-3">
            {interview.file_path && (
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors"
                onClick={() => window.open(interview.file_path, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            )}
            
            <button
              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6 space-y-6">
          {/* Key Quote */}
          {interview.key_quote && (
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Key Quote:</h4>
              <blockquote className="text-sm text-gray-700 italic leading-relaxed">
                &quot;{interview.key_quote}&quot;
              </blockquote>
            </div>
          )}

          {/* Key Insights */}
          {insights.length > 0 && (
            <div>
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
                    <div>
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
        </div>
      )}
    </div>
  )
} 