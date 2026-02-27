'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signUpBusiness } from '@/lib/auth'

type Category = { id: string; name: string; icon: string; slug: string }
const TOTAL_STEPS = 4

export default function BusinessRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(d => { if (d.categories) setCategories(d.categories) })
      .catch(() => {})
  }, [])

  const [form, setForm] = useState({
    ownerName: '', email: '', password: '', confirmPassword: '',
    businessName: '', categoryId: '', city: '', size: '',
    hasBooking: '', acceptsWalkIns: '', agreedToTerms: false,
  })

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const nextStep = () => {
    setError('')
    if (step === 1) {
      if (!form.ownerName || !form.email || !form.password || !form.confirmPassword) { setError('Please fill in all fields'); return }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
      if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    }
    if (step === 2) {
      if (!form.businessName || !form.categoryId || !form.city) { setError('Please fill in all fields'); return }
    }
    if (step === 3 && !form.size) { setError('Please select an option'); return }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!form.hasBooking) { setError('Please select an option'); return }
    if (!form.agreedToTerms) { setError('You must agree to the Terms & Conditions and Privacy Policy'); return }
    setLoading(true)
    setError('')
    try {
      await signUpBusiness({
        email: form.email, password: form.password, fullName: form.ownerName,
        businessName: form.businessName, categoryId: form.categoryId, city: form.city,
        size: form.size, hasBooking: form.hasBooking === 'yes', acceptsWalkIns: form.acceptsWalkIns === 'yes',
      })
      window.location.href = '/business/setup'
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
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600' as const, color: '#ccc', marginBottom: '0.5rem' }
  const optionCardStyle = (selected: boolean) => ({
    border: selected ? '2px solid #c9933a' : '2px solid #222', borderRadius: '1rem',
    padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s',
    backgroundColor: selected ? '#1a1200' : '#111', display: 'flex', alignItems: 'center', gap: '1rem',
  })

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
        <div style={{ width: '100%', maxWidth: '500px', animation: 'fadeInUp 0.5s ease both' }}>

          {/* PROGRESS BAR */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Step {step} of {TOTAL_STEPS}</span>
              <span style={{ fontSize: '0.8rem', color: '#c9933a', fontWeight: '600' }}>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
            </div>
            <div style={{ height: '4px', backgroundColor: '#222', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#c9933a', borderRadius: '2px', width: `${(step / TOTAL_STEPS) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {error && (
            <div style={{ background: '#1a0a0a', border: '1px solid #e05c5c', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#e05c5c', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Create your business account</h1>
                <p style={{ color: '#888', fontSize: '0.95rem' }}>Start by creating your personal login credentials</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label style={labelStyle}>Your Full Name</label><input type="text" value={form.ownerName} onChange={e => update('ownerName', e.target.value)} placeholder="John Doe" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                <div><label style={labelStyle}>Email Address</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 characters" style={{ ...inputStyle, paddingRight: '3rem' }} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>{showPassword ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <div><label style={labelStyle}>Confirm Password</label><input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Repeat your password" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Tell us about your business</h1>
                <p style={{ color: '#888', fontSize: '0.95rem' }}>This is how clients will find you on Meda</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label style={labelStyle}>Business Name</label><input type="text" value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="e.g. Selam Hair Studio" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                <div>
                  <label style={labelStyle}>Business Category</label>
                  <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} style={{ ...inputStyle, color: form.categoryId ? '#f5f0e8' : '#888' }}>
                    <option value="">Select your category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>City in Canada</label>
                  <select value={form.city} onChange={e => update('city', e.target.value)} style={{ ...inputStyle, color: form.city ? '#f5f0e8' : '#888' }}>
                    <option value="">Select your city</option>
                    {['Toronto', 'Calgary', 'Edmonton', 'Ottawa', 'Vancouver', 'Montreal', 'Winnipeg', 'Hamilton', 'Kitchener'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>How do you operate?</h1>
                <p style={{ color: '#888', fontSize: '0.95rem' }}>This determines how your profile is set up</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div onClick={() => update('size', 'SOLO')} style={optionCardStyle(form.size === 'SOLO')}>
                  <span style={{ fontSize: '2rem' }}>🙋</span>
                  <div><div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>Just me</div><div style={{ color: '#888', fontSize: '0.85rem' }}>I work alone — one schedule, one profile</div></div>
                </div>
                <div onClick={() => update('size', 'TEAM')} style={optionCardStyle(form.size === 'TEAM')}>
                  <span style={{ fontSize: '2rem' }}>👥</span>
                  <div><div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>I have a team</div><div style={{ color: '#888', fontSize: '0.85rem' }}>Multiple employees, each with their own schedule</div></div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Do you want online booking?</h1>
                <p style={{ color: '#888', fontSize: '0.95rem' }}>Clients will be able to book appointments directly through Meda</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div onClick={() => update('hasBooking', 'yes')} style={optionCardStyle(form.hasBooking === 'yes')}>
                  <span style={{ fontSize: '2rem' }}>📅</span>
                  <div><div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>Yes, enable booking</div><div style={{ color: '#888', fontSize: '0.85rem' }}>Clients can book appointments through your profile</div></div>
                </div>
                <div onClick={() => update('hasBooking', 'no')} style={optionCardStyle(form.hasBooking === 'no')}>
                  <span style={{ fontSize: '2rem' }}>📋</span>
                  <div><div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>No, just show my info</div><div style={{ color: '#888', fontSize: '0.85rem' }}>Display your profile and let clients contact you directly</div></div>
                </div>
                {form.hasBooking === 'yes' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>Do you also accept walk-ins?</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div onClick={() => update('acceptsWalkIns', 'yes')} style={{ ...optionCardStyle(form.acceptsWalkIns === 'yes'), flex: 1, justifyContent: 'center', padding: '1rem' }}><span style={{ fontWeight: '700' }}>Yes</span></div>
                      <div onClick={() => update('acceptsWalkIns', 'no')} style={{ ...optionCardStyle(form.acceptsWalkIns === 'no'), flex: 1, justifyContent: 'center', padding: '1rem' }}><span style={{ fontWeight: '700' }}>No</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, backgroundColor: '#111', border: '1px solid #333', color: '#f5f0e8', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>
                ← Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button onClick={nextStep} style={{ flex: 2, backgroundColor: '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b07d2a')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c9933a')}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, backgroundColor: loading ? '#7a5820' : '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading ? (<><span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Creating your business...</>) : '🎉 Create My Business'}
              </button>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginTop: '1.5rem' }}>
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