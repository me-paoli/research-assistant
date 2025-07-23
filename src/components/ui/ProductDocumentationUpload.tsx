'use client'

import { useState, useRef, useEffect } from 'react'
import { useProductDocumentation } from '@/hooks/useProductDocumentation'
import { FileUploadZone } from './FileUploadZone'
import { Trash2, FileText, Upload } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'

export function ProductDocumentationUpload() {
  const { user } = useAuthContext()
  const {
    documentation,
    isUploading,
    uploadProgress,
    uploadDocumentation,
    fetchDocumentation,
    deleteDocumentation
  } = useProductDocumentation()
  
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documentation on mount
  useEffect(() => {
    fetchDocumentation()
  }, [fetchDocumentation])

  const handleFileDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setShowUploadForm(true)
      setUploadName(acceptedFiles[0].name.replace(/\.[^/.]+$/, '')) // Remove extension for default name
    }
  }

  const handleUpload = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-login-modal'))
      return
    }
    if (!selectedFile || !uploadName.trim()) return

    try {
      await uploadDocumentation(selectedFile, uploadName.trim(), uploadDescription.trim() || undefined)
      setShowUploadForm(false)
      setSelectedFile(null)
      setUploadName('')
      setUploadDescription('')
    } catch (error) {
      console.error('Upload failed:', error)
      // You could add a toast notification here
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-login-modal'))
      return
    }
    if (confirm('Are you sure you want to delete this documentation?')) {
      await deleteDocumentation(id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Documentation
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Upload PRD, specifications, or other product documentation to provide additional context for AI analysis.
        </p>
        
        {!showUploadForm ? (
          <FileUploadZone
            onDrop={handleFileDrop}
            isUploading={isUploading}
          />
        ) : (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{selectedFile?.name}</span>
              </div>
              <button
                onClick={() => {
                  setShowUploadForm(false)
                  setSelectedFile(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="doc-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name
                </label>
                <input
                  id="doc-name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Product Requirements Document"
                />
              </div>
              
              <div>
                <label htmlFor="doc-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="doc-description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-gray-900 placeholder-gray-500"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of this document"
                  rows={2}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleUpload}
                  disabled={!uploadName.trim() || isUploading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <Upload className="w-4 h-4 mr-2 animate-pulse" />
                      Uploading...
                    </div>
                  ) : (
                    'Upload Document'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowUploadForm(false)
                    setSelectedFile(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      {documentation.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</h3>
          <div className="space-y-2">
            {documentation.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                    {doc.description && (
                      <div className="text-xs text-gray-600">{doc.description}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      {doc.file_name} • {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 