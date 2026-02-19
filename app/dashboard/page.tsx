'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ClientDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const [activeTab, setActiveTab] = useState<'bookings' | 'saved'>('bookings')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else setUser(data.user)
    })
  }, [])

  const name = user?.user_metadata?.full_name || user?.email || 'there'

  const tabStyle = (active: boolean) => ({
    padding: '0.6rem 1.25rem',
    borderRadius: '0.75rem',
    fontWeight: '600' as const,
    fontSize: '0.9rem',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    backgroundColor: active ? '#c9933a' : 'transparent',
    color: active ? '#0a0a0a' : '#888',
  })

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>

      {/* NAVBAR */}
      <nav style={{
        borderBottom: '1px solid #222', padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>
          Meda
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/browse" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>Browse</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            Sign Out
          </button>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#c9933a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '0.9rem', color: '#0a0a0a',
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* WELCOME */}
        <div style={{ marginBottom: '2.5rem', animation: 'fadeInUp 0.5s ease both' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.4rem' }}>
            Welcome back, {name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#888', fontSize: '0.95rem' }}>
            Manage your bookings and saved businesses
          </p>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
          marginBottom: '2.5rem', animation: 'fadeInUp 0.5s ease 0.1s both',
        }}>
          {[
            { icon: '🔍', label: 'Browse Businesses', href: '/browse' },
            { icon: '📅', label: 'My Bookings', action: () => setActiveTab('bookings') },
            { icon: '❤️', label: 'Saved Businesses', action: () => setActiveTab('saved') },
          ].map((item, i) => (
            item.href ? (
              <Link key={i} href={item.href} style={{
                backgroundColor: '#111', border: '1px solid #222',
                borderRadius: '1rem', padding: '1.25rem',
                textDecoration: 'none', color: '#f5f0e8',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                <span style={{ fontSize: '1.75rem' }}>{item.icon}</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.label}</span>
              </Link>
            ) : (
              <div key={i} onClick={item.action} style={{
                backgroundColor: '#111', border: '1px solid #222',
                borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                <span style={{ fontSize: '1.75rem' }}>{item.icon}</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.label}</span>
              </div>
            )
          ))}
        </div>

        {/* TABS */}
        <div style={{
          backgroundColor: '#111', border: '1px solid #222', borderRadius: '1.25rem',
          overflow: 'hidden', animation: 'fadeInUp 0.5s ease 0.2s both',
        }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #222', display: 'flex', gap: '0.5rem' }}>
            <button style={tabStyle(activeTab === 'bookings')} onClick={() => setActiveTab('bookings')}>
              📅 My Bookings
            </button>
            <button style={tabStyle(activeTab === 'saved')} onClick={() => setActiveTab('saved')}>
              ❤️ Saved Businesses
            </button>
          </div>

          <div style={{ padding: '2rem' }}>
            {activeTab === 'bookings' && (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No bookings yet</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Browse businesses and book your first appointment
                </p>
                <Link href="/browse" style={{
                  backgroundColor: '#c9933a', color: '#0a0a0a',
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem',
                }}>
                  Browse Businesses
                </Link>
              </div>
            )}
            {activeTab === 'saved' && (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
                <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No saved businesses yet</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Save businesses you love to find them quickly later
                </p>
                <Link href="/browse" style={{
                  backgroundColor: '#c9933a', color: '#0a0a0a',
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem',
                }}>
                  Browse Businesses
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  )
}