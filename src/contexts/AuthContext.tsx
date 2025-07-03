'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthState, AppUser } from '@/types/database'
import { getSiteUrl } from '@/lib/getSiteUrl'

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<AppUser>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Supabase session:', session)
        if (session?.user) {
          fetchUserProfile(session.user)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error getting session:', err)
        setLoading(false)
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    });

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          company_name: data.company_name,
          created_at: data.created_at,
          updated_at: data.updated_at
        })
      } else {
        // Create user profile if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            full_name: supabaseUser.user_metadata?.full_name || null,
            company_name: supabaseUser.user_metadata?.company_name || null
          })
          .select()
          .single()

        if (createError) throw createError

        setUser({
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          company_name: newUser.company_name,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        })
      }
    } catch (err: unknown) {
      console.error('Error fetching user profile:', err)
      setError('Failed to load user profile')
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, companyName: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName
          },
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        }
      })

      if (error) throw error
    } catch (err: unknown) {
      setError(err as string)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
    } catch (err: unknown) {
      setError(err as string)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (err: unknown) {
      setError(err as string)
      throw err
    }
  }

  const updateProfile = async (updates: Partial<AppUser>) => {
    try {
      setError(null)
      if (!user) throw new Error('No user logged in')
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUser({
        ...user,
        ...data
      })
    } catch (err: unknown) {
      setError(err as string)
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 