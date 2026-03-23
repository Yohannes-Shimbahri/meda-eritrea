'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

function getIcon(type: string) {
  switch (type) {
    case 'NEW_BOOKING': return '📅'
    case 'BOOKING_CONFIRMED': return '✅'
    case 'BOOKING_CANCELLED': return '❌'
    case 'BOOKING_COMPLETED': return '🎉'
    case 'NEW_REVIEW': return '⭐'
    default: return '🔔'
  }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      setToken(session.access_token)

      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
      setLoading(false)

      // Mark all as read after viewing
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      })
    }
    init()
  }, [])

  const dashboardHref = user?.user_metadata?.role === 'BUSINESS_OWNER' ? '/business/dashboard' : '/dashboard'

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #222', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href={dashboardHref} style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>← Dashboard</Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>🔔 Notifications</h1>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={async () => {
                if (!token) return
                await fetch('/api/notifications', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({}),
                })
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
              }}
              style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.4rem 0.875rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#f5f0e8' }}>No notifications yet</h3>
            <p style={{ fontSize: '0.9rem' }}>You'll see booking updates and reviews here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  backgroundColor: n.isRead ? '#111' : '#1a1200',
                  border: `1px solid ${n.isRead ? '#222' : '#c9933a44'}`,
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: '0.1rem' }}>{getIcon(n.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{n.title}</span>
                    <span style={{ color: '#555', fontSize: '0.75rem', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>{n.body}</p>
                </div>
                {!n.isRead && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c9933a', flexShrink: 0, marginTop: '0.4rem' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}