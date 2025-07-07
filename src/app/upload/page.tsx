'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { UploadProgress } from '@/types/database'

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const pollingIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const [recent, setRecent] = useState<any[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [deleting, setDeleting] = useState<{ [id: string]: boolean }>({})
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productUrl, setProductUrl] = useState('');

  // Helper to poll interview status
  const pollInterviewStatus = (interviewId: string, fileName: string) => {
    if (pollingIntervals.current[fileName]) return // already polling
    pollingIntervals.current[fileName] = setInterval(async () => {
      try {
        const res = await fetch(`/api/interview?id=${interviewId}`)
        if (!res.ok) return
        const data = await res.json()
        const interview = data.interview
        // Debug: log the status value
        console.log('Interview status:', interview.status)
        if (["complete", "completed", "failed"].includes(interview.status)) {
          setUploads(prev => prev.map(u =>
            u.file_name === fileName
              ? { ...u, progress: interview.status === 'complete' || interview.status === 'completed' ? 100 : u.progress, status: interview.status, interview }
              : u
          ))
          console.log("Interview complete:", interview)
          clearInterval(pollingIntervals.current[fileName])
          delete pollingIntervals.current[fileName]
        }
      } catch {}
    }, 3000)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file_name: file.name,
      progress: 0,
      status: 'uploading'
    }))
    setUploads(prev => [...prev, ...newUploads])
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const upload = newUploads[i]
      try {
        setUploads(prev => prev.map(u =>
          u.file_name === upload.file_name
            ? { ...u, progress: 10, status: 'uploading' }
            : u
        ))
        // Upload file to /api/upload
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const result = await res.json()
        if (res.ok && result.success) {
          setUploads(prev => prev.map(u =>
            u.file_name === upload.file_name
              ? { ...u, progress: 60, status: 'processing', interview: result.interview }
              : u
          ))
          // Trigger processing, but don't await
          fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewId: result.interview.id })
          })
          // Start polling for status
          pollInterviewStatus(result.interview.id, upload.file_name)
        } else {
          setUploads(prev => prev.map(u =>
            u.file_name === upload.file_name
              ? { ...u, status: 'error', error: result.error || 'Upload failed' }
              : u
          ))
        }
      } catch (error) {
        setUploads(prev => prev.map(u =>
          u.file_name === upload.file_name
            ? { ...u, status: 'error', error: 'Upload failed' }
            : u
        ))
      }
    }
    setIsUploading(false)
  }, [])

  useEffect(() => {
    // Cleanup intervals on unmount
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true,
    disabled: isUploading
  })

  const removeUpload = (fileName: string) => {
    setUploads(prev => prev.filter(u => u.file_name !== fileName))
  }

  const downloadFile = async (filePath: string) => {
    window.open(filePath, '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  const handleDelete = async (id: string) => {
    setDeleting(prev => ({ ...prev, [id]: true }))
    try {
      await fetch(`/api/interview?id=${id}`, { method: 'DELETE' })
      setRecent(prev => prev.filter((i) => i.id !== id))
      setUploads(prev => prev.filter((u) => u.interview?.id !== id))
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }))
    }
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
        {/* Product Context Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Product Context (Global)</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              // TODO: Call API endpoint to update product_context in DB
              // Example: await fetch('/api/product-context', { method: 'POST', body: JSON.stringify({ name: productName, description: productDescription, url: productUrl }) })
              alert('Product context saved (API call not implemented in this edit).');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g. MyApp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Description</label>
              <textarea
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                value={productDescription}
                onChange={e => setProductDescription(e.target.value)}
                placeholder="Short description of your product"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Product URL</label>
              <input
                type="url"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                value={productUrl}
                onChange={e => setProductUrl(e.target.value)}
                placeholder="https://yourproduct.com"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Product Context
            </button>
          </form>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Interviews</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your research interview files. <b>Only PDF and DOCX files are supported.</b>
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
                : isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isUploading ? 'text-gray-400' : 'text-gray-400'}`} />
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the files here...</p>
            ) : isUploading ? (
              <div>
                <p className="text-lg text-gray-600 mb-2">Uploading files...</p>
                <p className="text-sm text-gray-500">Please wait while files are being processed</p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports <b>PDF and DOCX files up to 10MB each</b>
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
                      {upload.status === 'completed' && upload.interview && upload.interview.file_path && (
                        <button
                          onClick={() => downloadFile(upload.interview.file_path)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeUpload(upload.file_name)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Show progress bar only during upload */}
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {/* Show processing badge/spinner */}
                  {upload.status === 'processing' && (
                    <span className="inline-flex items-center px-2 py-1 mt-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                      <svg className="animate-spin h-4 w-4 mr-1 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                      Processing with AI...
                    </span>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">
                      {upload.status === 'uploading' && 'Uploading to server...'}
                      {upload.status === 'processing' && 'Processing with AI...'}
                      {upload.status === 'completed' && 'Completed - Ready for search'}
                      {upload.status === 'error' && upload.error}
                    </span>
                    {upload.status === 'uploading' && (
                      <span className="text-sm text-gray-500">{upload.progress}%</span>
                    )}
                  </div>
                  {/* Show AI-extracted metadata if available */}
                  {upload.status === 'completed' && upload.interview && (
                    <div className="mt-4 text-sm text-gray-700">
                      <div><b>Subject:</b> {upload.interview.subject_name || 'N/A'}</div>
                      <div><b>Date:</b> {upload.interview.interview_date || 'N/A'}</div>
                      <div><b>Summary:</b> {upload.interview.summary || 'N/A'}</div>
                      <div><b>Tags:</b> {(upload.interview.keywords && upload.interview.keywords.length > 0) ? upload.interview.keywords.join(', ') : 'N/A'}</div>
                      <div><b>Sentiment:</b> {getSentimentLabel(upload.interview.sentiment)}</div>
                      <div><b>Fit Score:</b> {upload.interview.pmf_score !== undefined && upload.interview.pmf_score !== null ? `${upload.interview.pmf_score}%` : 'N/A'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Uploads Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Uploads</h2>
          {loadingRecent ? (
            <div className="flex items-center text-gray-500"><Loader2 className="animate-spin w-4 h-4 mr-2" /> Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-gray-500">No uploads yet.</div>
          ) : (
            <div className="space-y-4">
              {recent.map((interview) => (
                <div key={interview.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{interview.file_name || interview.title || 'Untitled'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {interview.status === 'complete' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {interview.status === 'failed' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {interview.status === 'processing' && (
                        <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
                      )}
                      {interview.file_path && (
                        <button
                          onClick={() => downloadFile(interview.file_path)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {/* Cancel/Delete button */}
                      {['processing', 'uploading'].includes(interview.status) && (
                        <button
                          onClick={() => handleDelete(interview.id)}
                          className="text-red-500 hover:text-red-700 px-2 py-1 text-xs border border-red-200 rounded disabled:opacity-50"
                          disabled={deleting[interview.id]}
                          title="Cancel and delete"
                        >
                          {deleting[interview.id] ? <Loader2 className="animate-spin w-4 h-4" /> : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <span className="mr-2">{interview.status === 'complete' ? 'Completed' : interview.status === 'processing' ? 'Processing...' : interview.status === 'failed' ? 'Failed' : 'Pending'}</span>
                    <span>{interview.created_at && new Date(interview.created_at).toLocaleString()}</span>
                  </div>
                  {/* Show AI-extracted metadata if available */}
                  {interview.status === 'complete' && (
                    <div className="mt-2 text-sm text-gray-700">
                      <div><b>Subject:</b> {interview.subject_name || 'N/A'}</div>
                      <div><b>Date:</b> {interview.interview_date || 'N/A'}</div>
                      <div><b>Summary:</b> {interview.summary || 'N/A'}</div>
                      <div><b>Tags:</b> {(interview.keywords && interview.keywords.length > 0) ? interview.keywords.join(', ') : 'N/A'}</div>
                      <div><b>Sentiment:</b> {getSentimentLabel(interview.sentiment)}</div>
                      <div><b>Fit Score:</b> {interview.pmf_score !== undefined && interview.pmf_score !== null ? `${interview.pmf_score}%` : 'N/A'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Upload Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Supported formats: PDF, DOCX</li>
              <li>• Maximum file size: 10MB per file</li>
              <li>• Files are securely stored in cloud storage</li>
              <li>• Automatic processing and indexing for search</li>
              <li>• Keywords and themes extracted automatically</li>
              <li>• You can add custom tags and categories after upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 