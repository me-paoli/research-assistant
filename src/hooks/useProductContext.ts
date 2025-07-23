'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
    
    // Test authentication
    const testAuth = async () => {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/test-auth', { headers })
        const data = await res.json()
        console.log('Auth test result:', data)
      } catch (error) {
        console.error('Auth test error:', error)
      }
    }
    testAuth()
  }, [])

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    console.log('Auth session:', session)
    console.log('Token exists:', !!token)
    console.log('Token length:', token?.length || 0)
    console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'none')
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    console.log('Final headers:', headers)
    return headers
  }

  const loadProductContext = async () => {
    try {
      console.log('=== LOADING PRODUCT CONTEXT ===')
      const headers = await getAuthHeaders()
      console.log('Headers for loading:', headers)
      
      const res = await fetch('/api/product-context', { headers })
      console.log('Load response status:', res.status)
      console.log('Load response ok:', res.ok)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Load response data:', data)
        const context = data.data.productContext
        console.log('Loaded context:', context)
        
        if (context) {
          setSavedContext(context)
          setProductName(context.name)
          setProductDescription(context.description)
          setProductUrl(context.url)
          console.log('Set form values from saved context')
        } else {
          // No saved context, start with empty form
          setSavedContext(null)
          setProductName('')
          setProductDescription('')
          setProductUrl('')
          console.log('No saved context found, using empty form')
        }
      } else {
        console.error('Failed to load product context:', res.status, res.statusText)
        const errorText = await res.text()
        console.error('Error response:', errorText)
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
      console.log('=== SAVING PRODUCT CONTEXT ===')
      console.log('Context to save:', context)
      const headers = await getAuthHeaders()
      console.log('Headers for saving:', headers)
      
      const res = await fetch('/api/product-context', {
        method: 'POST',
        headers,
        body: JSON.stringify(context)
      })
      
      console.log('Save response status:', res.status)
      console.log('Save response ok:', res.ok)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Save response data:', data)
        const savedContext = data.data.productContext
        console.log('Saved context:', savedContext)
        
        setSavedContext(savedContext)
        setIsEditing(false)
        setSaveMessage({ type: 'success', message: 'Product context saved successfully!' })
        
        // Trigger insights regeneration after product context is updated
        try {
          console.log("Triggering insights regeneration after product context update")
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
    console.log('=== SUBMITTING PRODUCT CONTEXT ===')
    console.log('productName:', productName)
    console.log('productDescription:', productDescription)
    console.log('productUrl:', productUrl)
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