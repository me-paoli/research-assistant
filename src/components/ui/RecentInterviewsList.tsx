'use client'

import { Trash2, Download } from 'lucide-react'
import { Interview } from '@/types/database'

interface RecentInterviewsListProps {
  interviews: Interview[]
  deleting: { [id: string]: boolean }
  onDelete: (id: string) => void
}

export function RecentInterviewsList({ interviews, deleting, onDelete }: RecentInterviewsListProps) {
  const getSentimentLabel = (sentiment: number | string | null | undefined) => {
    if (sentiment === null || sentiment === undefined) return 'N/A'
    const value = typeof sentiment === 'string' ? parseFloat(sentiment) : sentiment
    if (typeof value !== 'number' || isNaN(value)) return 'N/A'
    if (value <= 4) return 'Negative'
    if (value === 5) return 'Neutral'
    if (value >= 6) return 'Positive'
    return 'N/A'
  }

  const downloadFile = async (filePath: string) => {
    window.open(filePath, '_blank')
  }

  if (interviews.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Recent Interviews</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {interviews.map((interview) => (
          <div
            key={interview.id}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {interview.file_name || interview.title || 'Untitled'}
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(interview.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                {interview.file_path && (
                  <button
                    onClick={() => downloadFile(interview.file_path!)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(interview.id)}
                  disabled={deleting[interview.id]}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                  title="Delete interview"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              {interview.product_fit_score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Fit:</span>
                  <span className="font-medium">{interview.product_fit_score}/10</span>
                </div>
              )}
              {interview.sentiment_score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sentiment:</span>
                  <span className={`font-medium ${
                    getSentimentLabel(interview.sentiment_score) === 'Positive' ? 'text-green-600' :
                    getSentimentLabel(interview.sentiment_score) === 'Negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {getSentimentLabel(interview.sentiment_score)}
                  </span>
                </div>
              )}
              {interview.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{interview.duration} min</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 