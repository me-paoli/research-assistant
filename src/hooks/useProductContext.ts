import { useState, useEffect } from 'react'

interface ProductContext {
  name: string
  description: string
  url: string
}

interface SavedProductContext {
  id: string
  name: string
  description: string
  url: string
  created_at: string
  updated_at: string
}

export function useProductContext() {
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [savedContext, setSavedContext] = useState<SavedProductContext | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Load existing product context on mount
  useEffect(() => {
    loadProductContext()
  }, [])

  const loadProductContext = async () => {
    try {
      const res = await fetch('/api/product-context')
      if (res.ok) {
        const data = await res.json()
        const context = data.data.productContext
        
        if (context) {
          setSavedContext(context)
          setProductName(context.name)
          setProductDescription(context.description)
          setProductUrl(context.url)
        } else {
          // No saved context, start with empty form
          setSavedContext(null)
          setProductName('')
          setProductDescription('')
          setProductUrl('')
        }
      }
    } catch (error) {
      console.error('Error loading product context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveProductContext = async (context: ProductContext) => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      const res = await fetch('/api/product-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      })
      
      if (res.ok) {
        const data = await res.json()
        const savedContext = data.data.productContext
        
        setSavedContext(savedContext)
        setIsEditing(false)
        setSaveMessage({ type: 'success', message: 'Product context saved successfully!' })
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', message: 'Failed to save product context. Please try again.' })
      }
    } catch (error) {
      console.error('Error saving product context:', error)
      setSaveMessage({ type: 'error', message: 'An error occurred while saving. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProductContext({
      name: productName,
      description: productDescription,
      url: productUrl
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    setSaveMessage(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form to saved values
    if (savedContext) {
      setProductName(savedContext.name)
      setProductDescription(savedContext.description)
      setProductUrl(savedContext.url)
    }
    setSaveMessage(null)
  }

  return {
    productName,
    setProductName,
    productDescription,
    setProductDescription,
    productUrl,
    setProductUrl,
    savedContext,
    isEditing,
    isLoading,
    isSaving,
    saveMessage,
    handleSubmit,
    handleEdit,
    handleCancel
  }
} 