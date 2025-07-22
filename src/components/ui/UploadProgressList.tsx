'use client'

import { X, CheckCircle, AlertCircle, Download, Loader2, Clock } from 'lucide-react'
import { UploadProgress } from '@/types/database'

interface UploadProgressListProps {
  uploads: UploadProgress[]
  onRemove: (uploadId: string) => void
}

export function UploadProgressList({ uploads, onRemove }: UploadProgressListProps) {
  const downloadFile = async (filePath: string) => {
    window.open(filePath, '_blank')
  }

  if (uploads.length === 0) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'processing':
        return <Clock className="w-4 h-4 animate-pulse text-orange-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading file...'
      case 'processing':
        return 'Processing with AI...'
      case 'completed':
        return 'Processing complete'
      case 'error':
        return 'Processing failed'
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Upload Progress</h3>
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">{upload.file_name}</span>
              {getStatusIcon(upload.status)}
            </div>
            <button
              onClick={() => onRemove(upload.id)}
              className="text-gray-400 hover:text-gray-600"
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
          <div className={`text-sm ${getStatusColor(upload.status)}`}>
            {getStatusText(upload.status)}
          </div>
          
          {/* Error message */}
          {upload.status === 'error' && upload.error && (
            <div className="text-sm text-red-600 mt-1">
              Error: {upload.error}
            </div>
          )}
          
          {/* Processing details */}
          {upload.status === 'processing' && upload.interview && (
            <div className="text-xs text-gray-600 mt-1">
              Interview ID: {upload.interview.id}
            </div>
          )}
          
          {/* Download button for completed uploads */}
          {upload.status === 'completed' && upload.interview && upload.interview.file_path && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-green-600">Ready for analysis</span>
              <button
                onClick={() => downloadFile(upload.interview!.file_path!)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 