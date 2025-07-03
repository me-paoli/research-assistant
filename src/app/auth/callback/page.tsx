"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthError } from '@supabase/supabase-js';

export default function AuthCallback() {
  const [message, setMessage] = useState('Verifying your email…');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // For email links the tokens are already in the URL fragment.
    // getSession() parses them, stores the session, and removes the hash.
    supabase.auth
      .getSession()
      .then(({ error }: { error: AuthError | null }) => {
        if (error) throw error;
        router.replace('/dashboard');      // 🚧 choose your post-login page
      })
      .catch((err: unknown) => {
        console.error('Auth callback error', err);
        setMessage('Sorry, verification failed.');
        // Optionally redirect to /error or back to /signin after a delay
      });
  }, [router, supabase]);

  return (
    <main className="flex h-screen items-center justify-center text-white bg-black">
      <p>{message}</p>
    </main>
  );
} 