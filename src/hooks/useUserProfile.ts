'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  organization: string | null
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const { user } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load profile on mount or when user changes
  useEffect(() => {
    if (user) {
      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Get the session to get the access token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      const response = await fetch('/api/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (displayName: string, organization: string) => {
    if (!user) return
    
    try {
      setSaving(true)
      setError(null)
      
      // Get the session to get the access token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          organization: organization.trim() || null
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        return { success: true }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save profile')
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      setError('Failed to save profile')
      return { success: false, error: 'Failed to save profile' }
    } finally {
      setSaving(false)
    }
  }

  return {
    profile,
    loading,
    saving,
    error,
    saveProfile,
    loadProfile
  }
} 