'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type AdminTab = 'overview' | 'businesses' | 'users' | 'bookings' | 'reviews'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [stats, setStats] = useState({ businesses: 0, users: 0, bookings: 0, reviews: 0, pending: 0 })
  const [businesses, setBusinesses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const res = await fetch('/api/admin/check', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await res.json()
      if (!data.isAdmin) { window.location.href = '/'; return }
      setAuthorized(true)
      loadData(session.access_token)
    }
    init()
  }, [])

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
  }

  const loadData = async (token: string) => {
    setLoading(true)
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [statsRes, bizRes, usersRes, bookRes, revRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/businesses', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/bookings', { headers }),
        fetch('/api/admin/reviews', { headers }),
      ])
      const [statsData, bizData, usersData, bookData, revData] = await Promise.all([
        statsRes.json(), bizRes.json(), usersRes.json(), bookRes.json(), revRes.json()
      ])
      if (statsData.stats) setStats(statsData.stats)
      if (bizData.businesses) setBusinesses(bizData.businesses)
      if (usersData.users) setUsers(usersData.users)
      if (bookData.bookings) setBookings(bookData.bookings)
      if (revData.reviews) setReviews(revData.reviews)
    } catch { } finally { setLoading(false) }
  }

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000) }

  const toggleVerified = async (businessId: string, current: boolean) => {
    const headers = await getHeaders()
    const res = await fetch('/api/admin/businesses', { method: 'PATCH', headers, body: JSON.stringify({ businessId, isVerified: !current }) })
    const data = await res.json()
    if (data.success) { setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, isVerified: !current } : b)); showMsg(`✓ Business ${!current ? 'verified' : 'unverified'}`) }
  }

  const toggleApproved = async (businessId: string, current: boolean) => {
    const headers = await getHeaders()
    const res = await fetch('/api/admin/businesses', { method: 'PATCH', headers, body: JSON.stringify({ businessId, isApproved: !current }) })
    const data = await res.json()
    if (data.success) { setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, isApproved: !current } : b)); showMsg(`✓ Business ${!current ? 'approved' : 'suspended'}`) }
  }

  const setPlan = async (businessId: string, plan: string) => {
    const headers = await getHeaders()
    const res = await fetch('/api/admin/businesses', { method: 'PATCH', headers, body: JSON.stringify({ businessId, subscription: plan }) })
    const data = await res.json()
    if (data.success) { setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, subscription: plan } : b)); showMsg(`✓ Plan updated to ${plan}`) }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return
    const headers = await getHeaders()
    const res = await fetch('/api/admin/reviews', { method: 'DELETE', headers, body: JSON.stringify({ reviewId }) })
    const data = await res.json()
    if (data.success) { setReviews(prev => prev.filter(r => r.id !== reviewId)); showMsg('✓ Review deleted') }
  }

  if (!authorized) return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5f0e8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #333', borderTopColor: '#c9933a', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#888' }}>Checking access...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  const navStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem',
    borderRadius: '0.75rem', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' as const,
    backgroundColor: active ? '#c9933a' : 'transparent', color: active ? '#0a0a0a' : '#888',
    fontWeight: active ? '700' : '500' as const, fontSize: '0.9rem', transition: 'all 0.2s',
  })

  const filteredBiz = businesses.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase()) ||
    b.owner?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const planColor = (p: string) => p === 'PRO' ? '#c9933a' : p === 'STANDARD' ? '#60a5fa' : '#888'

  const categoryName = (b: any) => b.category?.name || b.categoryLegacy?.replace(/_/g, ' ') || '—'

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #222', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
          <span style={{ color: '#333' }}>|</span>
          <span style={{ color: '#e05c5c', fontSize: '0.85rem', fontWeight: '700' }}>⚡ Admin Panel</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {actionMsg && <span style={{ color: actionMsg.startsWith('✓') ? '#4ade80' : '#e05c5c', fontSize: '0.85rem', fontWeight: '600' }}>{actionMsg}</span>}
          <Link href="/" style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Site</Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR */}
        <aside style={{ width: '200px', borderRight: '1px solid #222', padding: '1.25rem 0.75rem', flexShrink: 0, position: 'sticky', top: '57px', height: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {([
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'businesses', icon: '🏪', label: `Businesses (${stats.businesses})` },
            { id: 'users', icon: '👥', label: `Users (${stats.users})` },
            { id: 'bookings', icon: '📅', label: `Bookings (${stats.bookings})` },
            { id: 'reviews', icon: '⭐', label: `Reviews (${stats.reviews})` },
          ] as const).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={navStyle(activeTab === item.id)}>
              <span>{item.icon}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>{item.label}</span>
            </button>
          ))}

          {/* ── Categories link ── */}
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #222' }}>
            <Link href="/admin/categories" style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem',
              borderRadius: '0.75rem', textDecoration: 'none', color: '#888',
              fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#c9933a'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1a1200' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#888'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}>
              <span>🗂️</span>
              <span>Categories</span>
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Admin Overview</h1>
              <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Platform-wide statistics and activity</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Businesses', value: stats.businesses, icon: '🏪', color: '#c9933a', tab: 'businesses' as AdminTab },
                  { label: 'Users', value: stats.users, icon: '👥', color: '#60a5fa', tab: 'users' as AdminTab },
                  { label: 'Bookings', value: stats.bookings, icon: '📅', color: '#4ade80', tab: 'bookings' as AdminTab },
                  { label: 'Pending', value: stats.pending, icon: '⏳', color: '#f59e0b', tab: 'bookings' as AdminTab },
                  { label: 'Reviews', value: stats.reviews, icon: '⭐', color: '#f472b6', tab: 'reviews' as AdminTab },
                ].map(s => (
                  <div key={s.label} onClick={() => setActiveTab(s.tab)} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <h2 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '1rem', color: '#888' }}>RECENTLY REGISTERED</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {businesses.slice(0, 5).map(b => (
                  <div key={b.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{b.name}</div>
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>{categoryName(b)} · {b.city} · {b.owner?.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: planColor(b.subscription), fontWeight: '700', fontSize: '0.8rem', backgroundColor: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '0.5rem' }}>{b.subscription}</span>
                      {b.isVerified && <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>✓ Verified</span>}
                      {!b.isApproved && <span style={{ color: '#e05c5c', fontSize: '0.75rem' }}>⚠ Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BUSINESSES */}
          {activeTab === 'businesses' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>Businesses</h1>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, city, or email..."
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', marginBottom: '1.5rem', boxSizing: 'border-box' as const }}
                onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredBiz.map(b => (
                  <div key={b.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{b.name}</span>
                          {b.isVerified && <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>✓ Verified</span>}
                          {!b.isApproved && <span style={{ backgroundColor: '#1f0a0a', color: '#e05c5c', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '0.4rem', fontWeight: '700' }}>Pending Approval</span>}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.82rem' }}>{categoryName(b)} · {b.city}, {b.province}</div>
                        <div style={{ color: '#666', fontSize: '0.78rem', marginTop: '0.2rem' }}>{b.owner?.email} · {b.owner?.fullName}</div>
                        <div style={{ color: '#555', fontSize: '0.75rem' }}>/{b.slug}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                        <span style={{ color: planColor(b.subscription), fontWeight: '700', fontSize: '0.82rem', backgroundColor: '#1a1a1a', padding: '0.25rem 0.6rem', borderRadius: '0.5rem' }}>{b.subscription}</span>
                        <span style={{ color: '#555', fontSize: '0.75rem' }}>{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => toggleVerified(b.id, b.isVerified)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: 'none', backgroundColor: b.isVerified ? '#0a1f0a' : '#222', color: b.isVerified ? '#4ade80' : '#888', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}>
                        {b.isVerified ? '✓ Verified' : 'Verify'}
                      </button>
                      <button onClick={() => toggleApproved(b.id, b.isApproved)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: 'none', backgroundColor: b.isApproved ? '#0a1f0a' : '#1f0a0a', color: b.isApproved ? '#4ade80' : '#e05c5c', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}>
                        {b.isApproved ? '✓ Approved' : 'Approve'}
                      </button>
                      {(['FREE', 'STANDARD', 'PRO'] as const).map(plan => (
                        <button key={plan} onClick={() => setPlan(b.id, plan)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #333', backgroundColor: b.subscription === plan ? '#1a1200' : 'transparent', color: b.subscription === plan ? '#c9933a' : '#666', cursor: 'pointer', fontSize: '0.78rem', fontWeight: b.subscription === plan ? '700' : '400' }}>
                          {plan}
                        </button>
                      ))}
                      <Link href={`/business/${b.slug}`} target="_blank" style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #333', backgroundColor: 'transparent', color: '#888', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'none' }}>View Profile ↗</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>Users</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {users.map(u => (
                  <div key={u.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{u.fullName}</div>
                      <div style={{ color: '#888', fontSize: '0.82rem' }}>{u.email}</div>
                      <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.2rem' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: u.role === 'SUPER_ADMIN' ? '#1f0a0a' : u.role === 'BUSINESS_OWNER' ? '#1a1200' : '#0a1a2a', color: u.role === 'SUPER_ADMIN' ? '#e05c5c' : u.role === 'BUSINESS_OWNER' ? '#c9933a' : '#60a5fa' }}>{u.role}</span>
                      {u.business && <Link href={`/business/${u.business.slug}`} target="_blank" style={{ color: '#888', fontSize: '0.78rem', textDecoration: 'none' }}>View Business ↗</Link>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>All Bookings</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bookings.map(b => (
                  <div key={b.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.2rem' }}>{b.client?.fullName} → {b.business?.name}</div>
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>{b.service?.name} · {new Date(b.date).toLocaleDateString()} {b.startTime && `@ ${b.startTime}`}</div>
                      {b.notes && <div style={{ color: '#666', fontSize: '0.75rem' }}>📝 {b.notes}</div>}
                    </div>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: b.status === 'CONFIRMED' ? '#0a1f0a' : b.status === 'CANCELLED' ? '#1f0a0a' : b.status === 'COMPLETED' ? '#0a0a1f' : '#1a1200', color: b.status === 'CONFIRMED' ? '#4ade80' : b.status === 'CANCELLED' ? '#e05c5c' : b.status === 'COMPLETED' ? '#60a5fa' : '#c9933a' }}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>All Reviews</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{r.client?.fullName} → <span style={{ color: '#c9933a' }}>{r.business?.name}</span></div>
                        <div style={{ color: '#f5c842', fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} <span style={{ color: '#555', fontSize: '0.78rem' }}>{new Date(r.createdAt).toLocaleDateString()}</span></div>
                      </div>
                      <button onClick={() => deleteReview(r.id)} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e05c5c33', backgroundColor: '#1f0a0a', color: '#e05c5c', cursor: 'pointer', fontSize: '0.78rem' }}>Delete</button>
                    </div>
                    {r.comment && <p style={{ color: '#ccc', fontSize: '0.88rem', margin: 0 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}