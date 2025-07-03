'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { UploadProgress } from '@/types/database'

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file_name: file.name,
      progress: 0,
      status: 'uploading'
    }))
    
    setUploads(prev => [...prev, ...newUploads])
    
    // Simulate upload process
    acceptedFiles.forEach((file, index) => {
      simulateUpload(file, newUploads[index])
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  })

  const simulateUpload = async (file: File, upload: UploadProgress) => {
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setUploads(prev => prev.map(u => 
        u.file_name === upload.file_name 
          ? { ...u, progress: i }
          : u
      ))
    }
    
    // Simulate processing
    setUploads(prev => prev.map(u => 
      u.file_name === upload.file_name 
        ? { ...u, status: 'processing' }
        : u
    ))
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Complete
    setUploads(prev => prev.map(u => 
      u.file_name === upload.file_name 
        ? { ...u, status: 'completed' }
        : u
    ))
  }

  const removeUpload = (fileName: string) => {
    setUploads(prev => prev.filter(u => u.file_name !== fileName))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Interviews</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your research interview files. We support PDF, DOC, DOCX, and TXT files.
            Files will be automatically processed and indexed for search.
          </p>
        </div>

        {/* Upload Area */}
        <div className="max-w-4xl mx-auto">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX, and TXT files up to 10MB each
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Progress</h2>
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.file_name} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{upload.file_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {upload.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {upload.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <button
                        onClick={() => removeUpload(upload.file_name)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        upload.status === 'completed' 
                          ? 'bg-green-500' 
                          : upload.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">
                      {upload.status === 'uploading' && 'Uploading...'}
                      {upload.status === 'processing' && 'Processing...'}
                      {upload.status === 'completed' && 'Completed'}
                      {upload.status === 'error' && upload.error}
                    </span>
                    <span className="text-sm text-gray-500">{upload.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Upload Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Supported formats: PDF, DOC, DOCX, TXT</li>
              <li>• Maximum file size: 10MB per file</li>
              <li>• Files will be automatically processed and indexed</li>
              <li>• Keywords and themes will be extracted automatically</li>
              <li>• You can add custom tags and categories after upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 