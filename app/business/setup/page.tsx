'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const STEPS = ['Profile', 'Hours', 'Services', 'Done']

export default function BusinessSetupPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    phone: '', address: '', instagram: '', facebook: '', website: '', bio: '',
  })

  const [hours, setHours] = useState([
    { day: 'Monday', open: '09:00', close: '18:00', closed: false },
    { day: 'Tuesday', open: '09:00', close: '18:00', closed: false },
    { day: 'Wednesday', open: '09:00', close: '18:00', closed: false },
    { day: 'Thursday', open: '09:00', close: '18:00', closed: false },
    { day: 'Friday', open: '09:00', close: '18:00', closed: false },
    { day: 'Saturday', open: '10:00', close: '16:00', closed: false },
    { day: 'Sunday', open: '10:00', close: '16:00', closed: true },
  ])

  const [services, setServices] = useState([
    { name: '', price: '', duration: '', priceType: 'fixed' }
  ])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else setUser(data.user)
    })
  }, [])

  const updateHour = (i: number, field: string, value: string | boolean) => {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h))
  }

  const updateService = (i: number, field: string, value: string) => {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const addService = () => setServices(prev => [...prev, { name: '', price: '', duration: '', priceType: 'fixed' }])
  const removeService = (i: number) => setServices(prev => prev.filter((_, idx) => idx !== i))

  const inputStyle = {
    width: '100%', background: '#0a0a0a', border: '1px solid #333',
    borderRadius: '0.75rem', padding: '0.75rem 1rem',
    color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block', fontSize: '0.8rem',
    fontWeight: '600' as const, color: '#888', marginBottom: '0.4rem',
  }

  const businessName = user?.user_metadata?.business_name || 'Your Business'

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>

      {/* NAVBAR */}
      <nav style={{
        borderBottom: '1px solid #222', padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <span style={{ color: '#888', fontSize: '0.9rem' }}>Setting up: <span style={{ color: '#f5f0e8', fontWeight: '600' }}>{businessName}</span></span>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* STEP INDICATOR */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '0.85rem',
                backgroundColor: i <= step ? '#c9933a' : '#222',
                color: i <= step ? '#0a0a0a' : '#888',
                transition: 'all 0.3s', flexShrink: 0,
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: i === step ? '#f5f0e8' : '#555', fontWeight: i === step ? '600' : '400', flexShrink: 0 }}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', backgroundColor: i < step ? '#c9933a' : '#222', margin: '0 1rem', transition: 'background-color 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Profile ── */}
        {step === 0 && (
          <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.4rem' }}>Complete your profile</h2>
            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Add your contact info and bio so clients can find and trust you</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (416) 000-0000" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                </div>
                <div>
                  <label style={labelStyle}>Address / Neighborhood</label>
                  <input type="text" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                    placeholder="e.g. Little Ethiopia, Toronto" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Instagram</label>
                  <input type="text" value={profile.instagram} onChange={e => setProfile(p => ({ ...p, instagram: e.target.value }))}
                    placeholder="@yourhandle" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                </div>
                <div>
                  <label style={labelStyle}>Facebook</label>
                  <input type="text" value={profile.facebook} onChange={e => setProfile(p => ({ ...p, facebook: e.target.value }))}
                    placeholder="facebook.com/yourpage" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input type="text" value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                    placeholder="yourwebsite.com" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Business Bio</label>
                <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell clients about your business, experience, and what makes you special..."
                  rows={4} style={{ ...inputStyle, resize: 'vertical' as const }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Hours ── */}
        {step === 1 && (
          <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.4rem' }}>Set your business hours</h2>
            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Clients will only be able to book during these hours</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {hours.map((h, i) => (
                <div key={h.day} style={{
                  display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px',
                  alignItems: 'center', gap: '1rem',
                  padding: '1rem', backgroundColor: '#111',
                  borderRadius: '0.75rem', border: '1px solid #222',
                  opacity: h.closed ? 0.5 : 1, transition: 'opacity 0.2s',
                }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{h.day}</span>
                  <input type="time" value={h.open} disabled={h.closed}
                    onChange={e => updateHour(i, 'open', e.target.value)}
                    style={{ ...inputStyle, padding: '0.5rem 0.75rem' }} />
                  <input type="time" value={h.close} disabled={h.closed}
                    onChange={e => updateHour(i, 'close', e.target.value)}
                    style={{ ...inputStyle, padding: '0.5rem 0.75rem' }} />
                  <button onClick={() => updateHour(i, 'closed', !h.closed)} style={{
                    padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                    backgroundColor: h.closed ? '#c9933a' : '#333',
                    color: h.closed ? '#0a0a0a' : '#888',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                  }}>
                    {h.closed ? 'Closed' : 'Open'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Services ── */}
        {step === 2 && (
          <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.4rem' }}>Add your services</h2>
            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>List the services you offer with pricing and duration</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {services.map((s, i) => (
                <div key={i} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#c9933a' }}>Service {i + 1}</span>
                    {services.length > 1 && (
                      <button onClick={() => removeService(i)} style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Service Name</label>
                      <input type="text" value={s.name} onChange={e => updateService(i, 'name', e.target.value)}
                        placeholder="e.g. Haircut" style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Price (CAD)</label>
                      <input type="number" value={s.price} onChange={e => updateService(i, 'price', e.target.value)}
                        placeholder="e.g. 35" style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Duration (mins)</label>
                      <input type="number" value={s.duration} onChange={e => updateService(i, 'duration', e.target.value)}
                        placeholder="e.g. 30" style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addService} style={{
                border: '2px dashed #333', borderRadius: '1rem', padding: '1rem',
                backgroundColor: 'transparent', color: '#888', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9933a'; e.currentTarget.style.color = '#c9933a' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888' }}>
                + Add Another Service
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'fadeInUp 0.4s ease both' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.75rem' }}>
              You&apos;re all set!
            </h2>
            <p style={{ color: '#888', fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              Your business profile is ready. Go to your dashboard to upload photos, manage bookings, and more.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
              <Link href="/business/dashboard" style={{
                backgroundColor: '#c9933a', color: '#0a0a0a',
                padding: '1rem', borderRadius: '0.75rem',
                fontWeight: '700', textDecoration: 'none', fontSize: '1rem',
              }}>
                Go to My Dashboard →
              </Link>
              <Link href="/" style={{
                border: '1px solid #333', color: '#888',
                padding: '1rem', borderRadius: '0.75rem',
                fontWeight: '600', textDecoration: 'none', fontSize: '0.95rem',
              }}>
                View Homepage
              </Link>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        {step < 3 && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                flex: 1, backgroundColor: '#111', border: '1px solid #333',
                color: '#f5f0e8', padding: '1rem', borderRadius: '0.75rem',
                fontWeight: '600', fontSize: '1rem', cursor: 'pointer',
              }}>
                ← Back
              </button>
            )}
            <button
              onClick={async () => {
                if (step === 2) {
                  setSaving(true)
                  await new Promise(r => setTimeout(r, 1000))
                  setSaving(false)
                }
                setStep(s => s + 1)
              }}
              style={{
                flex: 2, backgroundColor: '#c9933a', color: '#0a0a0a',
                padding: '1rem', borderRadius: '0.75rem', fontWeight: '700',
                fontSize: '1rem', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
              {saving ? (
                <><span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Saving...</>
              ) : step === 2 ? 'Finish Setup' : 'Continue →'}
            </button>
          </div>
        )}

        {step < 3 && (
          <p style={{ textAlign: 'center', color: '#555', fontSize: '0.85rem', marginTop: '1rem' }}>
            <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>
              Skip for now
            </button>
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}