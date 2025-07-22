import { useState, useCallback } from 'react'
import { ProductDocumentation } from '@/types/database'

export function useProductDocumentation() {
  const [documentation, setDocumentation] = useState<ProductDocumentation[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

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

      const response = await fetch('/api/product-documentation', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      setDocumentation(prev => [result.data.documentation, ...prev])
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))

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
      const response = await fetch('/api/product-documentation')
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
      const response = await fetch(`/api/product-documentation/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setDocumentation(prev => prev.filter(doc => doc.id !== id))
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