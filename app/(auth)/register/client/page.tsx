'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signUpClient, signInWithGoogle } from '@/lib/auth'

export default function ClientRegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', agreedToTerms: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!form.agreedToTerms) { setError('You must agree to the Terms & Conditions and Privacy Policy'); return }
    setLoading(true)
    setError('')
    try {
      await signUpClient({ email: form.email, password: form.password, fullName: form.fullName })
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#111', border: '1px solid #333',
    borderRadius: '0.75rem', padding: '0.875rem 1rem',
    color: '#f5f0e8', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  }
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600' as const, color: '#ccc', marginBottom: '0.5rem' }

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <span style={{ color: '#888', fontSize: '0.9rem' }}>
          <span className="hide-mobile">Already have an account?{' '}</span>
          <Link href="/login" style={{ color: '#c9933a', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
        </span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeInUp 0.5s ease both' }}>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Create your account</h1>
          <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.95rem' }}>Join the Habesha community in Canada</p>

          {error && (
            <div style={{ background: '#1a0a0a', border: '1px solid #e05c5c', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#e05c5c', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)}
                placeholder="Your full name" required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
            </div>

            <div>
              <label style={labelStyle}>Email address</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="you@example.com" required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Min 8 characters" required style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                placeholder="Repeat your password" required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
            </div>

            <button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#7a5820' : '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? (
                <><span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Creating account...</>
              ) : 'Create Account'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#222' }} />
              <span style={{ color: '#555', fontSize: '0.85rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#222' }} />
            </div>

            <button type="button" onClick={() => signInWithGoogle()}
              style={{ backgroundColor: '#111', border: '1px solid #333', color: '#f5f0e8', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

          </form>

          <p style={{ textAlign: 'center', color: '#555', fontSize: '0.85rem', marginTop: '2rem' }}>
            Are you a business owner?{' '}
            <Link href="/register/business" style={{ color: '#c9933a', textDecoration: 'none', fontWeight: '600' }}>Register your business</Link>
          </p>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginTop: '1rem' }}>
            <input type="checkbox" checked={form.agreedToTerms}
              onChange={e => setForm(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
              style={{ marginTop: '2px', accentColor: '#c9933a', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }} />
            <span style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.5 }}>
              I agree to Meda&apos;s{' '}
              <Link href="/terms" target="_blank" style={{ color: '#c9933a', textDecoration: 'underline' }}>Terms & Conditions</Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" style={{ color: '#c9933a', textDecoration: 'underline' }}>Privacy Policy</Link>
            </span>
          </label>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </main>
  )
}