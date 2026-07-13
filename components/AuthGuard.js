'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthGuard({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let didTimeout = false;

    // Safety net: if the session check hasn't resolved in 8s (slow/dropped
    // connection), stop showing a spinner forever and treat as logged out.
    const timeout = setTimeout(() => {
      didTimeout = true;
      setLoading(false);
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (didTimeout) return; // timeout already resolved this
      clearTimeout(timeout);
      setSession(session);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout);
      setSession(session);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!session && pathname !== '/login') {
      router.push('/login');
    } else if (session && pathname === '/login') {
      router.push('/');
    }
  }, [loading, session, pathname, router]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session && pathname !== '/login') {
    return null;
  }

  if (session && pathname === '/login') {
    return null;
  }

  return children;
}