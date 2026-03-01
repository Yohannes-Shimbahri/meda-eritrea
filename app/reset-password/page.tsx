'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Supabase puts the token in the URL hash — getSession picks it up automatically
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidSession(true)
      else setError('This reset link is invalid or has expired.')
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      // Sign out so they log in fresh with new password
      await supabase.auth.signOut()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#111', border: '1px solid #333', borderRadius: '0.75rem',
    padding: '0.875rem 1rem', color: '#f5f0e8', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  }

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeInUp 0.5s ease both' }}>

          {checking ? (
            <div style={{ textAlign: 'center', color: '#888' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #333', borderTopColor: '#c9933a', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
              Verifying reset link...
            </div>

          ) : done ? (
            /* SUCCESS */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem' }}>Password updated!</h1>
              <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Your password has been changed successfully. Sign in with your new password.
              </p>
              <Link href="/login" style={{ display: 'block', backgroundColor: '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', textDecoration: 'none', textAlign: 'center' }}>
                Sign In
              </Link>
            </div>

          ) : !validSession ? (
            /* INVALID LINK */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem' }}>Link expired</h1>
              <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '2rem' }}>
                This password reset link is invalid or has already been used. Request a new one.
              </p>
              <Link href="/forgot-password" style={{ display: 'block', backgroundColor: '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', textDecoration: 'none', textAlign: 'center' }}>
                Request New Link
              </Link>
            </div>

          ) : (
            /* FORM */
            <>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '1rem', backgroundColor: '#1a1200', border: '1px solid #c9933a44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1.25rem' }}>
                  🔒
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Set new password</h1>
                <p style={{ color: '#888', fontSize: '0.95rem' }}>Choose a strong password for your account.</p>
              </div>

              {error && (
                <div style={{ background: '#1a0a0a', border: '1px solid #e05c5c', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#e05c5c', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#ccc', marginBottom: '0.5rem' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      style={{ ...inputStyle, paddingRight: '3rem' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#333')}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '1rem' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ height: '4px', backgroundColor: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '2px', transition: 'all 0.3s', width: password.length < 8 ? '33%' : password.length < 12 ? '66%' : '100%', backgroundColor: password.length < 8 ? '#e05c5c' : password.length < 12 ? '#f59e0b' : '#4ade80' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: password.length < 8 ? '#e05c5c' : password.length < 12 ? '#f59e0b' : '#4ade80', marginTop: '0.25rem', display: 'block' }}>
                        {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#ccc', marginBottom: '0.5rem' }}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? '#e05c5c' : '#333' }}
                    onFocus={e => (e.currentTarget.style.borderColor = confirmPassword !== password ? '#e05c5c' : '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = confirmPassword && confirmPassword !== password ? '#e05c5c' : '#333')}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <span style={{ fontSize: '0.75rem', color: '#e05c5c', marginTop: '0.25rem', display: 'block' }}>Passwords don&apos;t match</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: loading ? '#7a5820' : '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#b07d2a' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#c9933a' }}
                >
                  {loading ? (
                    <><span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Updating password...</>
                  ) : 'Update Password'}
                </button>
              </form>
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
