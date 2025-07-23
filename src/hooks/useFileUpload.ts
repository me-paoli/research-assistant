import { useState, useCallback, useRef, useEffect } from 'react'
import { UploadProgress } from '@/types/database'
import { supabase } from '@/lib/supabase'

const UPLOAD_PROGRESS_KEY = 'upload_progress'

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

  // Load persisted upload progress on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(UPLOAD_PROGRESS_KEY)
      if (saved) {
        const savedUploads: UploadProgress[] = JSON.parse(saved)
        // Only restore uploads that are still processing
        const activeUploads = savedUploads.filter(u => 
          u.status === 'uploading' || u.status === 'processing'
        )
        if (activeUploads.length > 0) {
          setUploads(activeUploads)
          // Restart polling for processing uploads
          activeUploads.forEach(upload => {
            if (upload.interview?.id && upload.status === 'processing') {
              pollInterviewStatus(upload.interview.id, upload.file_name)
            }
          })
        }
      }
    } catch (error) {
      console.error('Error loading saved upload progress:', error)
    }
  }, [])

  // Save upload progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(UPLOAD_PROGRESS_KEY, JSON.stringify(uploads))
    } catch (error) {
      console.error('Error saving upload progress:', error)
    }
  }, [uploads])

  /**
   * Get authentication headers for API requests
   */
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }, [])

  /**
   * Polls interview status until completion or failure
   * @param interviewId - The interview ID to poll
   * @param fileName - The file name to update progress for
   */
  const pollInterviewStatus = useCallback(async (interviewId: string, fileName: string) => {
    if (pollingIntervals.current[fileName]) return // already polling
    console.log(`Starting to poll interview ${interviewId} for file ${fileName}`)
    pollingIntervals.current[fileName] = setInterval(async () => {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch(`/api/interview?id=${interviewId}`, {
          headers
        })
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
          
          // Trigger insights generation after interview is completed
          try {
            console.log("Triggering insights generation after interview completion")
            const insightsHeaders = await getAuthHeaders()
            fetch('/api/insights', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...insightsHeaders
              }
            }).then(res => {
              console.log(`Insights generation response status: ${res.status}`)
              return res.json()
            }).then(data => {
              console.log('Insights generation response:', data)
            }).catch(error => {
              console.error('Insights generation error:', error)
            })
          } catch (error) {
            console.error('Failed to trigger insights generation:', error)
          }
          
          // Remove from localStorage after a delay to show completion
          setTimeout(() => {
            setUploads(prev => prev.filter(u => u.file_name !== fileName))
          }, 3000)
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
  }, [getAuthHeaders])

  /**
   * Uploads files to the server and starts processing
   * @param acceptedFiles - Array of files to upload
   */
  const uploadFiles = useCallback(async (acceptedFiles: File[]) => {
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
      
      // Set uploading state for this specific file
      setIsUploading(true)
      setUploads(prev => prev.map(u =>
        u.file_name === upload.file_name
          ? { ...u, progress: 10, status: 'uploading' }
          : u
      ))
      
      try {
        // Upload file to /api/upload
        const formData = new FormData()
        formData.append('file', file)
        const headers = await getAuthHeaders()
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers,
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
          const processHeaders = await getAuthHeaders()
          fetch('/api/process', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...processHeaders
            },
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
          
          // Also trigger insights generation immediately for the first interview
          // (in case there are no existing insights yet)
          try {
            console.log("Triggering initial insights generation")
            const insightsHeaders = await getAuthHeaders()
            fetch('/api/insights', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...insightsHeaders
              }
            }).then(res => {
              console.log(`Initial insights generation response status: ${res.status}`)
              return res.json()
            }).then(data => {
              console.log('Initial insights generation response:', data)
            }).catch(error => {
              console.error('Initial insights generation error:', error)
            })
          } catch (error) {
            console.error('Failed to trigger initial insights generation:', error)
          }
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
      
      // Set uploading to false after this file is done (uploaded or failed)
      setIsUploading(false)
    }
  }, [pollInterviewStatus, getAuthHeaders])

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