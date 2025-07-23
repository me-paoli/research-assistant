'use client'

import { useState, useEffect, useCallback } from 'react'
import { Interview } from '@/types/database'
import { supabase } from '@/lib/supabase'

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }, [])

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const headers = await getAuthHeaders()
      const res = await fetch('/api/interviews', { headers })
      
      if (!res.ok) {
        throw new Error(`Failed to fetch interviews: ${res.status}`)
      }
      
      const data = await res.json()
      const fetchedInterviews = data.data?.interviews || []
      setInterviews(fetchedInterviews)
    } catch (err) {
      console.error('Error fetching interviews:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch interviews')
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  return {
    interviews,
    loading,
    error,
    refetch: fetchInterviews
  }
} 