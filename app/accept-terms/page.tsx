'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

function AcceptTermsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/client/dashboard'
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  const handleAccept = async () => {
    if (!checked || loading) return
    setLoading(true)
    try {
      // Save acceptance to Supabase user metadata
      await supabase.auth.updateUser({
        data: {
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        }
      })

      // Create DB record
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch('/api/auth/ensure-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
      }

      router.push(next)
    } catch (err) {
      console.error('Terms acceptance failed', err)
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{
      backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        backgroundColor: '#111', border: '1px solid #333', borderRadius: '1.25rem',
        padding: '2rem', maxWidth: '480px', width: '100%',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', marginBottom: '1rem' }}>Meda</div>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            One last step
          </h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Please review and accept our terms to continue
          </p>
        </div>

        {/* Terms summary box */}
        <div style={{
          backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0.875rem',
          padding: '1.25rem', marginBottom: '1.5rem', maxHeight: '180px', overflowY: 'auto',
        }}>
          <ul style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
            <li>Your information is stored as described in our Privacy Policy</li>
            <li>Use the platform for lawful purposes only</li>
            <li>You are at least 18 years old or have parental consent</li>
            <li>Booking info may be shared with businesses you interact with</li>
            <li>We may send notifications related to your account and bookings</li>
          </ul>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <a href="/terms" target="_blank" style={{ color: '#c9933a', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Terms of Service
          </a>
          <a href="/privacy" target="_blank" style={{ color: '#c9933a', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Privacy Policy
          </a>
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          cursor: 'pointer', marginBottom: '1.75rem',
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{
              width: '18px', height: '18px', marginTop: '2px',
              accentColor: '#c9933a', flexShrink: 0, cursor: 'pointer',
            }}
          />
          <span style={{ color: '#ccc', fontSize: '0.875rem', lineHeight: 1.5 }}>
            I have read and agree to the{' '}
            <a href="/terms" target="_blank" style={{ color: '#c9933a' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" style={{ color: '#c9933a' }}>Privacy Policy</a>
          </span>
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleDecline}
            style={{
              flex: 1, padding: '0.875rem', borderRadius: '0.75rem',
              border: '1px solid #333', background: 'none', color: '#888',
              fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            style={{
              flex: 2, padding: '0.875rem', borderRadius: '0.75rem', border: 'none',
              backgroundColor: checked ? '#c9933a' : '#333',
              color: checked ? '#0a0a0a' : '#666',
              fontWeight: '700', cursor: checked && !loading ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem', transition: 'all 0.2s',
            }}
          >
            {loading ? 'Saving...' : 'Accept & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AcceptTermsPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888' }}>Loading...</div>
      </div>
    }>
      <AcceptTermsContent />
    </Suspense>
  )
}