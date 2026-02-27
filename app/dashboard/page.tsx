'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ClientDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const [activeTab, setActiveTab] = useState<'bookings' | 'saved'>('bookings')
  const [bookings, setBookings] = useState<any[]>([])
  const [savedBusinesses, setSavedBusinesses] = useState<any[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [unsaving, setUnsaving] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const res = await fetch('/api/bookings/my', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await res.json()
      if (data.bookings) setBookings(data.bookings)
    }
    init()
  }, [])

  const loadSaved = async () => {
    setLoadingSaved(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/saved', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await res.json()
      if (data.businesses) setSavedBusinesses(data.businesses)
    } catch { } finally { setLoadingSaved(false) }
  }

  useEffect(() => { if (activeTab === 'saved') loadSaved() }, [activeTab])

  const handleUnsave = async (businessId: string) => {
    setUnsaving(businessId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/saved', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ businessId }) })
      setSavedBusinesses(prev => prev.filter(b => b.id !== businessId))
    } catch { } finally { setUnsaving(null) }
  }

  const name = user?.user_metadata?.full_name || user?.email || 'there'

  const statusStyle = (status: string) => ({
    padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700',
    backgroundColor: status === 'CONFIRMED' ? '#0a1f0a' : status === 'CANCELLED' ? '#1f0a0a' : status === 'COMPLETED' ? '#0a0a1f' : '#1a1200',
    color: status === 'CONFIRMED' ? '#4ade80' : status === 'CANCELLED' ? '#e05c5c' : status === 'COMPLETED' ? '#60a5fa' : '#c9933a',
  })

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/browse" className="hide-mobile" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>Browse</Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} className="hide-mobile" style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>Sign Out</button>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#c9933a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: '#0a0a0a', flexShrink: 0 }}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.25rem', paddingBottom: '2rem' }}>

        {/* WELCOME */}
        <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.5s ease both' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800', marginBottom: '0.4rem' }}>Welcome back, {name.split(' ')[0]} 👋</h1>
          <p style={{ color: '#888', fontSize: '0.95rem' }}>Manage your bookings and saved businesses</p>
        </div>

        {/* STATS */}
        <div className="stats-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '2rem', animation: 'fadeInUp 0.5s ease 0.05s both' }}>
          {[
            { icon: '📅', label: 'Total Bookings', value: bookings.length, color: '#c9933a' },
            { icon: '✅', label: 'Confirmed', value: bookings.filter(b => b.status === 'CONFIRMED').length, color: '#4ade80' },
            { icon: '⏳', label: 'Pending', value: bookings.filter(b => b.status === 'PENDING').length, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="actions-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '2rem', animation: 'fadeInUp 0.5s ease 0.1s both' }}>
          {[
            { icon: '🔍', label: 'Browse Businesses', href: '/browse' },
            { icon: '📅', label: 'My Bookings', action: () => setActiveTab('bookings') },
            { icon: '❤️', label: 'Saved Businesses', action: () => setActiveTab('saved') },
          ].map((item, i) => (
            item.href ? (
              <Link key={i} href={item.href} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem', textDecoration: 'none', color: '#f5f0e8', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                <span style={{ fontSize: '1.75rem' }}>{item.icon}</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.label}</span>
              </Link>
            ) : (
              <div key={i} onClick={item.action} style={{ backgroundColor: '#111', border: `1px solid ${activeTab === (i === 1 ? 'bookings' : 'saved') ? '#c9933a' : '#222'}`, borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'border-color 0.2s' }}>
                <span style={{ fontSize: '1.75rem' }}>{item.icon}</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.label}</span>
              </div>
            )
          ))}
        </div>

        {/* TABS */}
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1.25rem', overflow: 'hidden', animation: 'fadeInUp 0.5s ease 0.15s both' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #222', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {([{ id: 'bookings', label: `📅 My Bookings`, count: bookings.length }, { id: 'saved', label: '❤️ Saved', count: savedBusinesses.length }] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', border: 'none', backgroundColor: activeTab === tab.id ? '#c9933a' : 'transparent', color: activeTab === tab.id ? '#0a0a0a' : '#888', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                {tab.label}
                {tab.count > 0 && <span style={{ backgroundColor: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : '#222', color: activeTab === tab.id ? '#0a0a0a' : '#c9933a', borderRadius: '1rem', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: '800' }}>{tab.count}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'bookings' && (
              bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                  <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No bookings yet</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Browse businesses and book your first appointment</p>
                  <Link href="/browse" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>Browse Businesses</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {bookings.map((booking: any) => (
                    <div key={booking.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem' }}>{booking.business?.name}</div>
                          <div style={{ color: '#888', fontSize: '0.85rem' }}>{booking.service?.name}{booking.service?.price ? ` · $${booking.service.price}` : ''}</div>
                          {booking.employee && <div style={{ color: '#888', fontSize: '0.85rem' }}>with {booking.employee.name}</div>}
                        </div>
                        <span style={statusStyle(booking.status)}>{booking.status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ color: '#888', fontSize: '0.85rem' }}>
                          📅 {new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {booking.startTime && <span style={{ color: '#c9933a', marginLeft: '0.5rem' }}>🕐 {booking.startTime}</span>}
                        </div>
                        <Link href={`/business/${booking.business?.slug}`} style={{ color: '#c9933a', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '600' }}>View →</Link>
                      </div>
                      {booking.notes && <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #1a1a1a' }}>📝 {booking.notes}</div>}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'saved' && (
              loadingSaved ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading saved businesses...</div>
              ) : savedBusinesses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
                  <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No saved businesses yet</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Tap the heart ♡ on any business profile to save it here</p>
                  <Link href="/browse" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>Browse Businesses</Link>
                </div>
              ) : (
                <div className="saved-grid" style={{ display: 'grid', gap: '1rem' }}>
                  {savedBusinesses.map((biz: any) => (
                    <div key={biz.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '1rem', overflow: 'hidden', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                      <div style={{ height: '120px', backgroundColor: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
                        {biz.coverImage ? <img src={biz.coverImage} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🏪</div>}
                        {biz.subscription === 'PRO' && <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: '800' }}>⭐ PRO</span>}
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{biz.name}</div>
                        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{biz.category?.replace(/_/g, ' ')} · 📍 {biz.city}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link href={`/business/${biz.slug}`} style={{ flex: 1, backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.5rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', textAlign: 'center', fontSize: '0.82rem' }}>View Profile</Link>
                          <button onClick={() => handleUnsave(biz.id)} disabled={unsaving === biz.id} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #333', backgroundColor: 'transparent', color: '#888', cursor: 'pointer', fontSize: '0.8rem' }}>{unsaving === biz.id ? '...' : '♥ Remove'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile sign out */}
        <div className="mobile-only" style={{ display: 'none', marginTop: '1.5rem', gap: '0.75rem' }}>
          <Link href="/browse" style={{ flex: 1, border: '1px solid #333', color: '#888', padding: '0.75rem', borderRadius: '0.75rem', textDecoration: 'none', textAlign: 'center', fontSize: '0.9rem', display: 'block' }}>🔍 Browse</Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ flex: 1, background: 'none', border: '1px solid #333', color: '#888', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>Sign Out</button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .stats-grid { grid-template-columns: repeat(3, 1fr); }
        .actions-grid { grid-template-columns: repeat(3, 1fr); }
        .saved-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
        @media (max-width: 600px) {
          .hide-mobile { display: none !important; }
          .mobile-only { display: flex !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .actions-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .saved-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </main>
  )
}