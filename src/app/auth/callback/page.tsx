"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [message, setMessage] = useState('Verifying your email…');
  const router = useRouter();

  useEffect(() => {
    // For email links the tokens are already in the URL fragment.
    // getSession() parses them, stores the session, and removes the hash.
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) throw error;
        if (session) {
          router.replace('/dashboard');
        } else {
          setMessage('No session found. Please try signing in again.');
        }
      })
      .catch((err: unknown) => {
        console.error('Auth callback error', err);
        setMessage('Sorry, verification failed.');
        // Optionally redirect to /error or back to /signin after a delay
      });
  }, [router]);

  return (
    <main className="flex h-screen items-center justify-center text-white bg-black">
      <p>{message}</p>
    </main>
  );
} 