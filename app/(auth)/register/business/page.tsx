'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signUpBusiness } from '@/lib/auth'

type Subcategory = { id: string; name: string; slug: string; icon: string }
type Category = { id: string; name: string; icon: string; slug: string; subcategories?: Subcategory[] }

const TOTAL_STEPS = 4

// Subscription limits
const CATEGORY_LIMITS: Record<string, number> = { FREE: 1, STANDARD: 3, PRO: Infinity }

type CategorySelection = { categoryId: string; subcategoryId: string }

export default function BusinessRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Multi-category selections — starts with one empty slot
  const [selections, setSelections] = useState<CategorySelection[]>([{ categoryId: '', subcategoryId: '' }])
  // For the "upgrade prompt" modal
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Selected subscription during registration (FREE by default)
  const [selectedPlan] = useState<'FREE' | 'STANDARD' | 'PRO'>('FREE')
  const maxCategories = CATEGORY_LIMITS[selectedPlan]

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(d => { if (d.categories) setCategories(d.categories) })
      .catch(() => {})
  }, [])

  const [form, setForm] = useState({
    ownerName: '', email: '', password: '', confirmPassword: '',
    businessName: '', city: '', size: '',
    hasBooking: '', acceptsWalkIns: '', agreedToTerms: false,
  })

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  // ── Category selection helpers ─────────────────────────
  const updateSelection = (index: number, field: 'categoryId' | 'subcategoryId', value: string) => {
    setSelections(prev => prev.map((s, i) => {
      if (i !== index) return s
      // If changing parent category, reset subcategory
      if (field === 'categoryId') return { categoryId: value, subcategoryId: '' }
      return { ...s, [field]: value }
    }))
  }

  const addSelection = () => {
    if (selections.length >= maxCategories) {
      setShowUpgradePrompt(true)
      return
    }
    setSelections(prev => [...prev, { categoryId: '', subcategoryId: '' }])
  }

  const removeSelection = (index: number) => {
    if (selections.length === 1) return // keep at least one
    setSelections(prev => prev.filter((_, i) => i !== index))
  }

  const getSubcategoriesFor = (categoryId: string): Subcategory[] => {
    return categories.find(c => c.id === categoryId)?.subcategories || []
  }

  // ── Validation ─────────────────────────────────────────
  const nextStep = () => {
    setError('')
    if (step === 1) {
      if (!form.ownerName || !form.email || !form.password || !form.confirmPassword) { setError('Please fill in all fields'); return }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
      if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    }
    if (step === 2) {
      if (!form.businessName || !form.city) { setError('Please fill in business name and city'); return }
      const validSelections = selections.filter(s => s.categoryId)
      if (validSelections.length === 0) { setError('Please select at least one category'); return }
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
      const validSelections = selections.filter(s => s.categoryId)
      // Primary category = first selection
      const primaryCategoryId = validSelections[0]?.categoryId || ''
      await signUpBusiness({
        email: form.email,
        password: form.password,
        fullName: form.ownerName,
        businessName: form.businessName,
        categoryId: primaryCategoryId,
        categorySelections: validSelections,
        city: form.city,
        size: form.size,
        hasBooking: form.hasBooking === 'yes',
        acceptsWalkIns: form.acceptsWalkIns === 'yes',
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
    padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s',
    backgroundColor: selected ? '#1a1200' : '#111', display: 'flex', alignItems: 'center', gap: '0.875rem',
  })

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #c9933a44', borderRadius: '1.25rem', padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '0.5rem', color: '#f5f0e8' }}>
              {selectedPlan === 'FREE' ? 'Upgrade to add more categories' : 'Upgrade to Pro for unlimited categories'}
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {selectedPlan === 'FREE'
                ? 'Free plan allows 1 category. Standard allows 3 categories. Pro is unlimited.'
                : 'Standard plan allows 3 categories. Upgrade to Pro for unlimited.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '0.75rem', padding: '1rem', textAlign: 'left' }}>
                {[
                  { plan: 'FREE', price: '$0/mo', cats: '1 category + 1 sub', color: '#888' },
                  { plan: 'STANDARD', price: '$19/mo', cats: '3 categories + 3 subs', color: '#60a5fa' },
                  { plan: 'PRO', price: '$39/mo', cats: 'Unlimited categories', color: '#c9933a' },
                ].map(p => (
                  <div key={p.plan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #222' }}>
                    <span style={{ color: p.color, fontWeight: '700', fontSize: '0.85rem' }}>{p.plan}</span>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>{p.cats}</span>
                    <span style={{ color: '#f5f0e8', fontSize: '0.8rem', fontWeight: '700' }}>{p.price}</span>
                  </div>
                ))}
              </div>
              <p style={{ color: '#555', fontSize: '0.8rem' }}>You can upgrade your plan after registration in your dashboard.</p>
              <button onClick={() => setShowUpgradePrompt(false)} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.875rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                Got it, continue with {selectedPlan}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ borderBottom: '1px solid #222', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <span style={{ color: '#888', fontSize: '0.875rem' }}>
          <span className="hide-mobile">Already have an account? </span>
          <Link href="/login" style={{ color: '#c9933a', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
        </span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '520px', animation: 'fadeInUp 0.5s ease both' }}>

          {/* Progress bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Step {step} of {TOTAL_STEPS}</span>
              <span style={{ fontSize: '0.8rem', color: '#c9933a', fontWeight: '600' }}>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
            </div>
            <div style={{ height: '4px', backgroundColor: '#222', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#c9933a', borderRadius: '2px', width: `${(step / TOTAL_STEPS) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {error && (
            <div style={{ background: '#1a0a0a', border: '1px solid #e05c5c', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#e05c5c', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{error}</div>
          )}

          {/* STEP 1 — Account */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', fontWeight: '800', marginBottom: '0.4rem' }}>Create your business account</h1>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Start by creating your personal login credentials</p>
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

          {/* STEP 2 — Business Info + Categories */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', fontWeight: '800', marginBottom: '0.4rem' }}>Tell us about your business</h1>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>This is how clients will find you on Meda</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <div><label style={labelStyle}>Business Name</label><input type="text" value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="e.g. Selam Hair Studio" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>

                <div>
                  <label style={labelStyle}>City in Canada</label>
                  <select value={form.city} onChange={e => update('city', e.target.value)} style={{ ...inputStyle, color: form.city ? '#f5f0e8' : '#888' }}>
                    <option value="">Select your city</option>
                    {['Toronto', 'Calgary', 'Edmonton', 'Ottawa', 'Vancouver', 'Montreal', 'Winnipeg', 'Hamilton', 'Kitchener'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* ── Category Selections ── */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>Business Categories</label>
                    <span style={{ fontSize: '0.72rem', color: '#555', backgroundColor: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #2a2a2a' }}>
                      {selectedPlan}: {maxCategories === Infinity ? 'unlimited' : `${selections.length}/${maxCategories}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selections.map((sel, i) => {
                      const subs = getSubcategoriesFor(sel.categoryId)
                      const isPrimary = i === 0
                      return (
                        <div key={i} style={{ background: '#111', border: `1px solid ${isPrimary ? '#c9933a44' : '#222'}`, borderRadius: '0.875rem', padding: '0.875rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isPrimary ? '#c9933a' : '#555' }}>
                              {isPrimary ? '★ Primary Category' : `Category ${i + 1}`}
                            </span>
                            {!isPrimary && (
                              <button onClick={() => removeSelection(i)} style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                            )}
                          </div>

                          {/* Parent category picker */}
                          <select
                            value={sel.categoryId}
                            onChange={e => updateSelection(i, 'categoryId', e.target.value)}
                            style={{ ...inputStyle, marginBottom: subs.length > 0 ? '0.5rem' : '0', color: sel.categoryId ? '#f5f0e8' : '#888', padding: '0.65rem 0.875rem', fontSize: '0.875rem' }}
                          >
                            <option value="">Select category...</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>

                          {/* Subcategory picker — only shows if parent has subcategories */}
                          {sel.categoryId && subs.length > 0 && (
                            <select
                              value={sel.subcategoryId}
                              onChange={e => updateSelection(i, 'subcategoryId', e.target.value)}
                              style={{ ...inputStyle, color: sel.subcategoryId ? '#f5f0e8' : '#888', padding: '0.65rem 0.875rem', fontSize: '0.875rem' }}
                            >
                              <option value="">Select subcategory (optional)...</option>
                              {subs.map(s => (
                                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Add more button */}
                  <button
                    onClick={addSelection}
                    style={{ marginTop: '0.6rem', width: '100%', background: 'none', border: `1px dashed ${selections.length >= maxCategories ? '#333' : '#c9933a55'}`, color: selections.length >= maxCategories ? '#444' : '#c9933a', padding: '0.6rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {selections.length >= maxCategories
                      ? `🔒 Upgrade to add more (${selectedPlan} limit reached)`
                      : `+ Add another category`
                    }
                  </button>

                  <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                    Your business will appear in all selected categories. You can edit these later in your dashboard after upgrading.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3 — Size */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', fontWeight: '800', marginBottom: '0.4rem' }}>How do you operate?</h1>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>This determines how your profile is set up</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div onClick={() => update('size', 'SOLO')} style={optionCardStyle(form.size === 'SOLO')}>
                  <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>🙋</span>
                  <div><div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Just me</div><div style={{ color: '#888', fontSize: '0.82rem' }}>I work alone — one schedule, one profile</div></div>
                </div>
                <div onClick={() => update('size', 'TEAM')} style={optionCardStyle(form.size === 'TEAM')}>
                  <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>👥</span>
                  <div><div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>I have a team</div><div style={{ color: '#888', fontSize: '0.82rem' }}>Multiple employees, each with their own schedule</div></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Booking */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', fontWeight: '800', marginBottom: '0.4rem' }}>Do you want online booking?</h1>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Clients can book appointments directly through Meda</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div onClick={() => update('hasBooking', 'yes')} style={optionCardStyle(form.hasBooking === 'yes')}>
                  <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>📅</span>
                  <div><div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Yes, enable booking</div><div style={{ color: '#888', fontSize: '0.82rem' }}>Clients can book appointments through your profile</div></div>
                </div>
                <div onClick={() => update('hasBooking', 'no')} style={optionCardStyle(form.hasBooking === 'no')}>
                  <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>📋</span>
                  <div><div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>No, just show my info</div><div style={{ color: '#888', fontSize: '0.82rem' }}>Display your profile and let clients contact you directly</div></div>
                </div>
                {form.hasBooking === 'yes' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ color: '#ccc', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>Do you also accept walk-ins?</p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div onClick={() => update('acceptsWalkIns', 'yes')} style={{ ...optionCardStyle(form.acceptsWalkIns === 'yes'), flex: 1, justifyContent: 'center', padding: '1rem' }}><span style={{ fontWeight: '700' }}>Yes</span></div>
                      <div onClick={() => update('acceptsWalkIns', 'no')} style={{ ...optionCardStyle(form.acceptsWalkIns === 'no'), flex: 1, justifyContent: 'center', padding: '1rem' }}><span style={{ fontWeight: '700' }}>No</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: '0.875rem', marginTop: '1.75rem' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, backgroundColor: '#111', border: '1px solid #333', color: '#f5f0e8', padding: '1rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button onClick={nextStep} style={{ flex: 2, backgroundColor: '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}>
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, backgroundColor: loading ? '#7a5820' : '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.95rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading ? (<><span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Creating...</>) : 'Create My Business'}
              </button>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginTop: '1.25rem' }}>
            <input type="checkbox" checked={form.agreedToTerms} onChange={e => setForm(prev => ({ ...prev, agreedToTerms: e.target.checked }))} style={{ marginTop: '2px', accentColor: '#c9933a', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }} />
            <span style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.5 }}>
              I agree to Meda&apos;s{' '}
              <Link href="/terms" target="_blank" style={{ color: '#c9933a', textDecoration: 'underline' }}>Terms &amp; Conditions</Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" style={{ color: '#c9933a', textDecoration: 'underline' }}>Privacy Policy</Link>
            </span>
          </label>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .hide-mobile { display: none; } }
      `}</style>
    </main>
  )
}