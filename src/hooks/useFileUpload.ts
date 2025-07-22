import { useState, useCallback, useRef, useEffect } from 'react'
import { UploadProgress } from '@/types/database'

/**
 * Custom hook for managing file upload functionality
 * 
 * Handles file uploads, progress tracking, and interview status polling
 * 
 * @returns {Object} Upload state and functions
 * @returns {UploadProgress[]} returns.uploads - Current upload progress
 * @returns {boolean} returns.isUploading - Whether files are currently uploading
 * @returns {Function} returns.uploadFiles - Function to upload files
 * @returns {Function} returns.removeUpload - Function to remove upload from list
 */
export function useFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const pollingIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({})

  /**
   * Polls interview status until completion or failure
   * @param interviewId - The interview ID to poll
   * @param fileName - The file name to update progress for
   */
  const pollInterviewStatus = useCallback((interviewId: string, fileName: string) => {
    if (pollingIntervals.current[fileName]) return // already polling
    console.log(`Starting to poll interview ${interviewId} for file ${fileName}`)
    pollingIntervals.current[fileName] = setInterval(async () => {
      try {
        const res = await fetch(`/api/interview?id=${interviewId}`)
        console.log(`Poll response status: ${res.status}`)
        if (!res.ok) {
          console.log(`Poll failed with status: ${res.status}`)
          return
        }
        const data = await res.json()
        console.log('Poll response data:', data)
        const interview = data.data.interview
        console.log('Interview status:', interview.status)
        if (["complete", "completed", "failed"].includes(interview.status)) {
          setUploads(prev => prev.map(u =>
            u.file_name === fileName
              ? { 
                  ...u, 
                  progress: interview.status === 'complete' || interview.status === 'completed' ? 100 : u.progress, 
                  status: interview.status === 'failed' ? 'error' : 'completed', 
                  interview 
                }
              : u
          ))
          console.log("Interview complete:", interview)
          clearInterval(pollingIntervals.current[fileName])
          delete pollingIntervals.current[fileName]
        }
      } catch (error) {
        console.error('Poll error:', error)
        // Mark as error after multiple failed attempts
        setUploads(prev => prev.map(u =>
          u.file_name === fileName
            ? { ...u, status: 'error', error: 'Failed to check processing status' }
            : u
        ))
        clearInterval(pollingIntervals.current[fileName])
        delete pollingIntervals.current[fileName]
      }
    }, 3000)
  }, [])

  /**
   * Uploads files to the server and starts processing
   * @param acceptedFiles - Array of files to upload
   */
  const uploadFiles = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        console.log('Upload response:', result)
        
        if (res.ok && result.success) {
          const interview = result.data.interview
          setUploads(prev => prev.map(u =>
            u.file_name === upload.file_name
              ? { ...u, progress: 60, status: 'processing', interview: interview }
              : u
          ))
          
          // Trigger processing, but don't await
          console.log(`Triggering processing for interview ${interview.id}`)
          fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewId: interview.id })
          }).then(res => {
            console.log(`Process API response status: ${res.status}`)
            return res.json()
          }).then(data => {
            console.log('Process API response:', data)
          }).catch(error => {
            console.error('Process API error:', error)
          })
          
          // Start polling for status
          pollInterviewStatus(interview.id, upload.file_name)
        } else {
          setUploads(prev => prev.map(u =>
            u.file_name === upload.file_name
              ? { ...u, status: 'error', error: result.error || 'Upload failed' }
              : u
          ))
        }
      } catch {
        setUploads(prev => prev.map(u =>
          u.file_name === upload.file_name
            ? { ...u, status: 'error', error: 'Upload failed' }
            : u
        ))
      }
    }
    setIsUploading(false)
  }, [pollInterviewStatus])

  /**
   * Removes an upload from the progress list
   * @param uploadId - The upload ID to remove
   */
  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId))
  }, [])

  // Cleanup intervals on unmount
  useEffect(() => {
    const intervals = pollingIntervals.current
    return () => {
      Object.values(intervals).forEach(clearInterval)
    }
  }, [])

  return {
    uploads,
    isUploading,
    uploadFiles,
    removeUpload
  }
} 