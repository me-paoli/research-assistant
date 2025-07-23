'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LoginModal() {
  const { login, error, loading, user } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-login-modal', handler)
    return () => window.removeEventListener('open-login-modal', handler)
  }, [])

  useEffect(() => {
    if (user && open) setOpen(false)
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setSignupSuccess(false)
    setMagicLinkSent(false)
    if (!email || ((mode === 'signin' || mode === 'signup') && !password)) {
      setLocalError('Email' + ((mode === 'signin' || mode === 'signup') ? ' and password' : '') + ' are required')
      return
    }
    if (mode === 'signin') {
      await login(email, password)
    } else if (mode === 'signup') {
      const { error: signupError } = await supabase.auth.signUp({ email, password })
      if (signupError) {
        setLocalError(signupError.message)
      } else {
        setSignupSuccess(true)
        setMode('signin')
      }
    } else if (mode === 'magic') {
      const { error: magicError } = await supabase.auth.signInWithOtp({ email })
      if (magicError) {
        setLocalError(magicError.message)
      } else {
        setMagicLinkSent(true)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen(false)}
          aria-label="Close login modal"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Magic Link Login'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required={mode === 'signin' || mode === 'signup'}
              />
            </div>
          )}
          {(localError || error) && (
            <div className="text-red-600 text-sm">{localError || error}</div>
          )}
          {signupSuccess && (
            <div className="text-green-600 text-sm">Signup successful! Please check your email to confirm your account, then sign in.</div>
          )}
          {magicLinkSent && (
            <div className="text-green-600 text-sm">Magic link sent! Please check your email to log in.</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? (mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Signing up...' : 'Sending magic link...')
              : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Magic Link')}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600 space-y-1">
          {mode !== 'magic' && (
            <div>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => { setMode('magic'); setLocalError(null); setSignupSuccess(false); setMagicLinkSent(false); setPassword('') }}
                type="button"
              >
                Use magic link instead
              </button>
            </div>
          )}
          {mode === 'magic' && (
            <div>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => { setMode('signin'); setLocalError(null); setSignupSuccess(false); setMagicLinkSent(false); setPassword('') }}
                type="button"
              >
                Use password instead
              </button>
            </div>
          )}
          {mode === 'signin' ? (
            <div>
              Don&apos;t have an account?{' '}
              <button
                className="text-blue-600 hover:underline"
                onClick={() => { setMode('signup'); setLocalError(null); setSignupSuccess(false); setMagicLinkSent(false); setPassword('') }}
                type="button"
              >
                Sign up
              </button>
            </div>
          ) : mode === 'signup' ? (
            <div>
              Already have an account?{' '}
              <button
                className="text-blue-600 hover:underline"
                onClick={() => { setMode('signin'); setLocalError(null); setSignupSuccess(false); setMagicLinkSent(false); setPassword('') }}
                type="button"
              >
                Sign in
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
} 