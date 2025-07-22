import { useState, useCallback } from 'react'
import { Interview } from '@/types/database'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Interview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchInterviews = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) {
        throw new Error('Search failed')
      }
      
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

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