'use client'

import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'

interface FileUploadZoneProps {
  onDrop: (acceptedFiles: File[]) => void
  isUploading: boolean
}

export function FileUploadZone({ onDrop, isUploading }: FileUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true,
    disabled: isUploading
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <div className="text-lg font-medium text-gray-700 mb-2">
        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
      </div>
      <div className="text-sm text-gray-600 mb-4">
        or click to select files
      </div>
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <FileText className="w-4 h-4 mr-1" />
          PDF
        </div>
        <div className="flex items-center">
          <FileText className="w-4 h-4 mr-1" />
          DOCX
        </div>
      </div>
    </div>
  )
} 