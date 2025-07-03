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
    const token = searchParams.get('token')
    const type = searchParams.get('type') as OtpType | null
    const email = searchParams.get('email')
    if (!token || !type || !email) {
      setStatus('error')
      return
    }

    supabase.auth.verifyOtp({ token, type, email })
      .then(({ error }) => {
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/'), 2000)
        }
      })
  }, [router, searchParams])

  if (status === 'verifying') return <div className="min-h-screen flex items-center justify-center">Verifying your email...</div>
  if (status === 'success') return <div className="min-h-screen flex items-center justify-center">Email verified! Redirecting...</div>
  return <div className="min-h-screen flex items-center justify-center">Verification failed. Please try again or contact support.</div>
} 