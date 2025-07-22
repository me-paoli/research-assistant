import { useState, useEffect } from 'react'
import { Interview } from '@/types/database'

/**
 * Custom hook for managing interview data
 * 
 * Handles fetching, loading, and deleting interviews
 * 
 * @returns {Object} Interview state and functions
 * @returns {Interview[]} returns.interviews - List of interviews
 * @returns {boolean} returns.loading - Whether interviews are being fetched
 * @returns {Object} returns.deleting - Map of interview IDs being deleted
 * @returns {Function} returns.deleteInterview - Function to delete an interview
 * @returns {Function} returns.refetch - Function to refetch interviews
 */
export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<{ [id: string]: boolean }>({})

  /**
   * Fetches all interviews from the API
   */
  const fetchInterviews = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/interviews')
      const data = await res.json()
      setInterviews(data.data?.interviews || [])
    } catch (error) {
      console.error('Failed to fetch interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Deletes an interview by ID
   * @param id - The interview ID to delete
   */
  const deleteInterview = async (id: string) => {
    setDeleting(prev => ({ ...prev, [id]: true }))
    try {
      await fetch(`/api/interview?id=${id}`, { method: 'DELETE' })
      setInterviews(prev => prev.filter((i) => i.id !== id))
    } catch (error) {
      console.error('Failed to delete interview:', error)
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }))
    }
  }

  useEffect(() => {
    fetchInterviews()
  }, [])

  return {
    interviews,
    loading,
    deleting,
    deleteInterview,
    refetch: fetchInterviews
  }
} 