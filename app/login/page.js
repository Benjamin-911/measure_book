'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else {
      // If we signed up but have no session, Supabase requires email confirmation
      if (isSignUp && !result.data.session) {
        setError('Sign up successful! Please check your email to confirm your account, or disable "Confirm Email" in your Supabase Auth settings.');
        setLoading(false);
      } else {
        router.push('/');
      }
    }
  }

  return (
    <main className="page-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', paddingBottom: 'var(--space-2xl)' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <h1 className="page-title" style={{ fontSize: '32px' }}>Measure Track</h1>
        <p className="page-subtitle">Your private tailoring assistant</p>
      </div>

      <div className="card">
        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="tailor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="inline-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 'var(--space-md)' }}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', fontSize: '13px', color: 'var(--ink-muted)' }}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </main>
  );
}
