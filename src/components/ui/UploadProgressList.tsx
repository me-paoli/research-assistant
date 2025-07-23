'use client'

import { X, CheckCircle, AlertCircle, Download, Loader2, Clock, Info, ChevronUp } from 'lucide-react'
import { UploadProgress } from '@/types/database'
import { useState } from 'react'

interface UploadProgressListProps {
  uploads: UploadProgress[]
  onRemove: (uploadId: string) => void
}

export function UploadProgressList({ uploads, onRemove }: UploadProgressListProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const downloadFile = async (filePath: string) => {
    window.open(filePath, '_blank')
  }

  if (uploads.length === 0) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'processing':
        return <Clock className="w-5 h-5 animate-pulse text-orange-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading file to server...'
      case 'processing':
        return 'AI is analyzing your interview...'
      case 'completed':
        return 'Analysis complete!'
      case 'error':
        return 'Processing failed'
      default:
        return 'Processing...'
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading file securely...'
      case 'processing':
        return 'AI analyzing interview (1-2 minutes)'
      case 'completed':
        return 'Ready for analysis'
      case 'error':
        return 'Processing failed - please try again'
      default:
        return 'Processing...'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600'
      case 'processing':
        return 'text-orange-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  const getBackgroundColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-50 border-blue-200'
      case 'processing':
        return 'bg-orange-50 border-orange-200'
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'processing')
  const completedUploads = uploads.filter(u => u.status === 'completed')
  const errorUploads = uploads.filter(u => u.status === 'error')

  return (
    <div className="fixed top-20 z-50">
      {/* Minimal indicator when collapsed - moved to left */}
      {!isExpanded && activeUploads.length > 0 && (
        <div className="left-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 animate-pulse text-orange-500" />
              <span className="text-sm font-medium text-gray-700">
                {activeUploads.length} interview{activeUploads.length === 1 ? '' : 's'} processing
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full expanded panel - stays on right */}
      {isExpanded && activeUploads.length > 0 && (
        <div className="right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" />
              Processing Interviews
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {activeUploads.length} active
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={`rounded-lg p-3 border ${getBackgroundColor(upload.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getStatusIcon(upload.status)}
                    <span className="font-medium text-gray-700 truncate">
                      {upload.file_name}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(upload.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Progress bar for uploading */}
                {upload.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                
                {/* Status text */}
                <div className={`text-sm font-medium ${getStatusColor(upload.status)}`}>
                  {getStatusText(upload.status)}
                </div>
                
                {/* Status description */}
                <div className="text-xs text-gray-600 mt-1">
                  {getStatusDescription(upload.status)}
                </div>
                
                {/* Error message */}
                {upload.status === 'error' && upload.error && (
                  <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                    Error: {upload.error}
                  </div>
                )}
                
                {/* Processing details */}
                {upload.status === 'processing' && upload.interview && (
                  <div className="text-xs text-gray-500 mt-2">
                    Interview ID: {upload.interview.id}
                  </div>
                )}
                
                {/* Success message for completed uploads */}
                {upload.status === 'completed' && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Ready for analysis
                    </span>
                    {upload.interview && upload.interview.file_path && (
                      <button
                        onClick={() => downloadFile(upload.interview!.file_path!)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
        </div>
      )}
    </div>
  )
} 