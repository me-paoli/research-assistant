"use client"

import { useAuth } from '@/contexts/AuthContext'
import PublicLanding from './PublicLanding'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If user is authenticated, redirect to dashboard (or show dashboard)
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Show landing page immediately for unauthenticated users
  if (!user) {
    return <PublicLanding />;
  }

  // Show loading spinner only if user is authenticated and loading
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Optionally, render dashboard content here if you want it on the root page
  return null;
}
