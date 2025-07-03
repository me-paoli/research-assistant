"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type OtpType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change'

export default function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    // First, try to get tokens from hash fragment (Supabase's preferred method)
    let access_token: string | null = null
    let refresh_token: string | null = null

    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      access_token = hashParams.get('access_token')
      refresh_token = hashParams.get('refresh_token')
    }

    // If we have access_token and refresh_token from hash, set the session
    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token,
      }).then(({ error }) => {
        if (error) {
          console.error('Session setting error:', error)
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 2000)
        }
      })
      return
    }

    // Fallback: try query parameters (older method)
    const token = searchParams.get('token')
    const queryType = searchParams.get('type') as OtpType | null
    const email = searchParams.get('email')
    
    if (!token || !queryType || !email) {
      console.error('Missing required parameters for verification')
      setStatus('error')
      return
    }

    supabase.auth.verifyOtp({ token, type: queryType, email })
      .then(({ error }) => {
        if (error) {
          console.error('OTP verification error:', error)
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 2000)
        }
      })
  }, [router, searchParams])

  if (status === 'verifying') return <div className="min-h-screen flex items-center justify-center">Verifying your email...</div>
  if (status === 'success') return <div className="min-h-screen flex items-center justify-center">Email verified! Redirecting to dashboard...</div>
  return <div className="min-h-screen flex items-center justify-center">Verification failed. Please try again or contact support.</div>
} 