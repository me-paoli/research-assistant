"use client"

import { useAuth } from '@/contexts/AuthContext'
import PublicLanding from './PublicLanding'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Handle Supabase auth errors from hash fragment
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');
      
      if (errorCode) {
        let errorMessage = 'Authentication error occurred.';
        
        if (errorCode === 'otp_expired') {
          errorMessage = 'Email verification link has expired. Please request a new verification email.';
        } else if (errorCode === 'access_denied') {
          errorMessage = 'Access denied. Please try signing up again.';
        } else if (errorDescription) {
          errorMessage = decodeURIComponent(errorDescription);
        }
        
        setError(errorMessage);
        
        // Clear the hash fragment to prevent showing error on refresh
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // If user is authenticated, redirect to dashboard (or show dashboard)
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Show error message if there's an auth error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href="/auth/signup"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign Up Again
            </a>
            <a
              href="/auth/signin"
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

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
