'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <Link href="/login" style={{ color: '#c9933a', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>← Back to Sign In</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeInUp 0.5s ease both' }}>

          {sent ? (
            /* SUCCESS STATE */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📬</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem' }}>Check your email</h1>
              <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                We sent a password reset link to
              </p>
              <p style={{ color: '#c9933a', fontWeight: '700', fontSize: '1rem', marginBottom: '2rem' }}>
                {email}
              </p>
              <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
                <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                  Click the link in the email to reset your password. The link will expire in <span style={{ color: '#f5f0e8' }}>1 hour</span>. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#f5f0e8', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', marginBottom: '1rem' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}
              >
                Resend email
              </button>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>
                Back to <span style={{ color: '#c9933a', fontWeight: '600' }}>Sign In</span>
              </Link>
            </div>
          ) : (
            /* FORM STATE */
            <>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '1rem', backgroundColor: '#1a1200', border: '1px solid #c9933a44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1.25rem' }}>
                  🔑
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Forgot password?</h1>
                <p style={{ color: '#888', fontSize: '0.95rem' }}>
                  No worries — enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div style={{ background: '#1a0a0a', border: '1px solid #e05c5c', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#e05c5c', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#ccc', marginBottom: '0.5rem' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#f5f0e8', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: loading ? '#7a5820' : '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#b07d2a' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#c9933a' }}
                >
                  {loading ? (
                    <><span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Sending...</>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: '#555', fontSize: '0.85rem', marginTop: '2rem' }}>
                Remember your password?{' '}
                <Link href="/login" style={{ color: '#c9933a', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
