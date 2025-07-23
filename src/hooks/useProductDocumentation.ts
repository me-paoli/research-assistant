'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ProductDocumentation } from '@/types/database'

export function useProductDocumentation() {
  const [documentation, setDocumentation] = useState<ProductDocumentation[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  const uploadDocumentation = useCallback(async (file: File, name: string, description?: string) => {
    setIsUploading(true)
    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      if (description) {
        formData.append('description', description)
      }

      setUploadProgress(prev => ({ ...prev, [file.name]: 50 }))

      const headers = await getAuthHeaders()
      const response = await fetch('/api/product-documentation', {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      setDocumentation(prev => [result.data.documentation, ...prev])
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))

      // Trigger insights regeneration after document upload
      try {
        console.log("Triggering insights regeneration after document upload")
        const insightsHeaders = await getAuthHeaders()
        fetch('/api/insights', {
          method: 'POST',
          headers: { 
            ...insightsHeaders,
            'Content-Type': 'application/json'
          }
        }).then(res => {
          console.log(`Insights regeneration response status: ${res.status}`)
          return res.json()
        }).then(data => {
          console.log('Insights regeneration response:', data)
        }).catch(error => {
          console.error('Insights regeneration error:', error)
        })
      } catch (error) {
        console.error('Failed to trigger insights regeneration:', error)
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }, 2000)

      return result.data.documentation
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  const fetchDocumentation = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/product-documentation', { headers })
      if (response.ok) {
        const result = await response.json()
        setDocumentation(result.data.documentation || [])
      }
    } catch (error) {
      console.error('Failed to fetch documentation:', error)
    }
  }, [])

  const deleteDocumentation = useCallback(async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/product-documentation/${id}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        setDocumentation(prev => prev.filter(doc => doc.id !== id))
        
        // Trigger insights regeneration after document deletion
        try {
          console.log("Triggering insights regeneration after document deletion")
          const insightsHeaders = await getAuthHeaders()
          fetch('/api/insights', {
            method: 'POST',
            headers: { 
              ...insightsHeaders,
              'Content-Type': 'application/json'
            }
          }).then(res => {
            console.log(`Insights regeneration response status: ${res.status}`)
            return res.json()
          }).then(data => {
            console.log('Insights regeneration response:', data)
          }).catch(error => {
            console.error('Insights regeneration error:', error)
          })
        } catch (error) {
          console.error('Failed to trigger insights regeneration:', error)
        }
      }
    } catch (error) {
      console.error('Failed to delete documentation:', error)
    }
  }, [])

  return {
    documentation,
    isUploading,
    uploadProgress,
    uploadDocumentation,
    fetchDocumentation,
    deleteDocumentation
  }
} 