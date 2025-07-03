"use client"

import { useAuth } from '@/contexts/AuthContext'
import PublicLanding from './PublicLanding'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <PublicLanding />;
  }

  // Optionally, you could render dashboard content here if you want it on the root page
  return null;
}
