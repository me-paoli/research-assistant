import { useState, useCallback } from 'react'
import { Interview } from '@/types/database'
import { supabase } from '@/lib/supabase'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Interview[]>([])
  const [loading, setLoading] = useState(false)
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

  const searchInterviews = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers
      })
      
      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`)
      }
      
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
    searchInterviews(searchQuery)
  }, [searchInterviews])

  return {
    query,
    results,
    loading,
    error,
    handleSearch,
    setQuery
  }
} 