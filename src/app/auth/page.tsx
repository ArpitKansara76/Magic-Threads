'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setIsError(true);
      setMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;
        
        setIsError(false);
        setMessage("Account created successfully! Auto-logging you in...");
        
        // Auto-redirect after signup
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        // Log In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        // Fetch profile to check role
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          setIsError(false);
          setMessage("Logged in successfully! Redirecting...");
          
          setTimeout(() => {
            if (profile?.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/');
            }
          }, 1000);
        }
      }
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <a href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <img src="/images/logo.png" alt="Magic Threads Logo" style={{ width: '96px', height: '96px', borderRadius: '50%', border: '2px solid var(--color-gold)', boxShadow: '0 4px 15px rgba(197, 155, 39, 0.15)' }} />
            <div style={{ textAlign: 'center' }}>
              <span className="brand-logo-text" style={{ fontSize: '2rem', display: 'block', fontWeight: '700', letterSpacing: '1px' }}>MAGIC THREADS</span>
              <div className="brand-logo-sub" style={{ marginTop: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', textTransform: 'lowercase' }}>where magic meets tradition</div>
            </div>
          </a>
          <h2 className="auth-title" style={{ marginTop: '1.5rem' }}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="auth-sub">
            {isSignUp 
              ? "Join Magic Threads to sync your inquiry bags and place orders" 
              : "Sign in with your email and password"}
          </p>
        </div>

        {message && (
          <div style={{
            padding: '0.8rem 1rem',
            borderRadius: '10px',
            fontSize: '0.9rem',
            backgroundColor: isError ? 'rgba(231, 76, 60, 0.15)' : 'rgba(46, 204, 113, 0.15)',
            border: `1px solid ${isError ? '#e74c3c' : '#2ecc71'}`,
            color: isError ? '#ff7675' : '#2ecc71',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <input
              type="email"
              id="auth-email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              type="password"
              id="auth-password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-auth"
            disabled={loading}
          >
            {loading ? "Processing..." : (isSignUp ? "Register" : "Sign In")}
          </button>
        </form>

        <div className="auth-switch-text">
          {isSignUp ? "Already have an account? " : "New to Magic Threads? "}
          <button 
            type="button" 
            className="auth-switch-link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
          >
            {isSignUp ? "Sign In" : "Register Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
