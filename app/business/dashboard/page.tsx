'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Tab = 'overview' | 'bookings' | 'portfolio' | 'profile' | 'gallery' | 'employees' | 'services' | 'hours' | 'settings' | 'analytics'

const navItems: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'bookings', icon: '📅', label: 'Bookings' },
  { id: 'portfolio', icon: '🖼️', label: 'Our Work' },
  { id: 'profile', icon: '✏️', label: 'Profile' },
  { id: 'gallery', icon: '📸', label: 'Gallery' },
  { id: 'employees', icon: '👥', label: 'Employees' },
  { id: 'services', icon: '📋', label: 'Services' },
  { id: 'hours', icon: '🕐', label: 'Hours' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

const PLAN_LIMITS: Record<string, number> = { FREE: 5, STANDARD: 20, PRO: Infinity }
const GALLERY_LIMITS: Record<string, number> = { FREE: 5, STANDARD: 10, PRO: Infinity }
const EMPLOYEE_LIMITS: Record<string, number> = { FREE: 1, STANDARD: 3, PRO: Infinity }

// ── ANALYTICS HELPERS ──────────────────────────────────────────────────────────

type AnalyticsData = {
  summary: {
    totalBookings: number
    periodBookings: number
    totalRevenue: number
    periodRevenue: number
    completionRate: number
    cancelled: number
    totalViews: number
    periodViews: number
    conversionRate: number
  }
  trend: { date: string; label: string; bookings: number; revenue: number }[]
  viewTrend: { date: string; label: string; views: number }[]
  topServices: { name: string; count: number; revenue: number }[]
  revenueByService: { name: string; revenue: number; bookings: number }[]
}

function MiniBarChart({ data, valueKey, color = '#c9933a', height = 80 }: {
  data: { label: string; [key: string]: any }[]
  valueKey: string
  color?: string
  height?: number
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const showEvery = Math.ceil(data.length / 10)
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${height}px` }}>
        {data.map((d, i) => {
          const pct = (d[valueKey] / max) * 100
          return (
            <div key={d.date ?? i} title={`${d.label}: ${d[valueKey]}`}
              style={{ flex: 1, height: `${Math.max(pct, d[valueKey] > 0 ? 4 : 1)}%`, backgroundColor: d[valueKey] > 0 ? color : '#222', borderRadius: '3px 3px 0 0', cursor: 'default', minWidth: 0 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
        {data.map((d, i) => (
          <div key={d.date ?? i} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '0.6rem', color: '#555', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {i % showEvery === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function HBar({ label, value, max, color = '#c9933a', suffix = '' }: {
  label: string; value: number; max: number; color?: string; suffix?: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{label}</span>
        <span style={{ color, fontWeight: '700', flexShrink: 0 }}>{suffix}{value.toLocaleString()}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function AnalyticsStatCard({ icon, label, value, sub, color = '#c9933a', locked = false }: {
  icon: string; label: string; value: string; sub?: string; color?: string; locked?: boolean
}) {
  return (
    <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      {locked && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,10,10,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🔒</div>
            <div style={{ color: '#c9933a', fontSize: '0.75rem', fontWeight: '700' }}>PRO only</div>
          </div>
        </div>
      )}
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: '800', color, marginBottom: '0.2rem' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#888' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  )
}

function AnalyticsTab({ getAuthHeaders, plan, onUpgrade, userId }: {
  getAuthHeaders: () => Promise<Record<string, string>>
  plan: string
  onUpgrade: () => void
  userId: string | null
}) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30d')
  const [chartMode, setChartMode] = useState<'bookings' | 'revenue'>('bookings')

  const isPro = plan === 'PRO'
  const hasAnalytics = plan === 'STANDARD' || plan === 'PRO'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const headers = await getAuthHeaders()
        const res = await fetch(`/api/business/analytics?range=${range}`, { headers })
        const json = await res.json()
        if (json.error === 'Unauthorized') { setData(null); return }
        // 404 = no business yet or no data — show empty state, not error
        if (!res.ok) { setData({ summary: { totalBookings: 0, periodBookings: 0, totalRevenue: 0, periodRevenue: 0, completionRate: 0, cancelled: 0, totalViews: 0, periodViews: 0, conversionRate: 0 }, trend: [], viewTrend: [], topServices: [], revenueByService: [] }); return }
        setData(json)
      } catch { setData(null) }
      finally { setLoading(false) }
    }
    load()
  }, [range, userId])

  if (!hasAnalytics) {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Analytics</h1>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Track your business performance</p>
        <div style={{ backgroundColor: '#111', border: '1px solid #c9933a44', borderRadius: '1.25rem', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ fontWeight: '800', marginBottom: '0.75rem' }}>Analytics is a paid feature</h2>
          <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Upgrade to Standard for booking trends, top services & revenue estimates.<br />
            Upgrade to Pro for profile views and conversion rates.
          </p>
          <button onClick={onUpgrade} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.875rem 2rem', borderRadius: '0.875rem', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}>
            Upgrade to Standard — $19/mo
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '2rem' }}>Analytics</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', height: '100px' }} />
          ))}
        </div>
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', height: '200px' }} />
      </div>
    )
  }

  // Handle missing or error response from API
  const hasValidData = data && data.summary && Array.isArray(data.trend)

  if (!hasValidData) return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Analytics</h1>
      <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Could not load analytics data.</div>
        <div style={{ color: '#555', fontSize: '0.8rem' }}>Make sure <code style={{ color: '#c9933a' }}>app/api/business/analytics/route.ts</code> exists and the migration ran.</div>
      </div>
    </div>
  )

  const summary = data.summary
  const trend = data.trend ?? []
  const viewTrend = data.viewTrend ?? []
  const topServices = data.topServices ?? []
  const revenueByService = data.revenueByService ?? []

  const maxBookings = Math.max(...topServices.map((s: any) => s.count), 1)
  const maxRevenue = Math.max(...revenueByService.map((s: any) => s.revenue), 1)
  const rangeLabel = range === '7d' ? 'last 7 days' : range === '90d' ? 'last 90 days' : 'last 30 days'

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Analytics</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Showing data for the <span style={{ color: '#c9933a' }}>{rangeLabel}</span>
            <span style={{ marginLeft: '0.5rem', color: isPro ? '#c9933a' : '#60a5fa', fontSize: '0.8rem', fontWeight: '700', backgroundColor: isPro ? '#1a1200' : '#0a0a1f', padding: '0.15rem 0.5rem', borderRadius: '1rem', border: `1px solid ${isPro ? '#c9933a44' : '#60a5fa44'}` }}>
              {plan}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.75rem', overflow: 'hidden' }}>
          {[['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']].map(([val, label]) => (
            <button key={val} onClick={() => setRange(val)} style={{ padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', backgroundColor: range === val ? '#c9933a' : 'transparent', color: range === val ? '#0a0a0a' : '#888', fontWeight: '600', fontSize: '0.85rem' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* PRO upgrade banner for STANDARD users */}
      {!isPro && (
        <div style={{ backgroundColor: '#1a1200', border: '1px solid #c9933a44', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#c9933a', marginBottom: '0.25rem' }}>⭐ Unlock Advanced Analytics</div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>Profile views, conversion rate & revenue breakdown require Pro.</div>
          </div>
          <button onClick={onUpgrade} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <AnalyticsStatCard icon="📅" label={`Bookings (${rangeLabel})`} value={String(summary.periodBookings)} sub={`${summary.totalBookings} all time`} color="#c9933a" />
        <AnalyticsStatCard icon="💰" label={`Revenue (${rangeLabel})`} value={`$${summary.periodRevenue.toLocaleString()}`} sub={`$${summary.totalRevenue.toLocaleString()} all time`} color="#4ade80" />
        <AnalyticsStatCard icon="✅" label="Completion rate" value={`${summary.completionRate}%`} sub={`${summary.cancelled} cancelled`} color="#60a5fa" />
        <AnalyticsStatCard icon="👁" label={`Profile views (${rangeLabel})`} value={isPro ? String(summary.periodViews) : '—'} sub={isPro ? `${summary.totalViews} all time` : undefined} color="#f472b6" locked={!isPro} />
      </div>

      {/* PRO conversion rate row */}
      {isPro && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <AnalyticsStatCard icon="🎯" label="Conversion rate" value={`${summary.conversionRate}%`} sub="views that booked" color="#a78bfa" />
          <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Views vs Bookings — {rangeLabel}</div>
            <MiniBarChart data={viewTrend} valueKey="views" color="#f472b644" height={60} />
          </div>
        </div>
      )}

      {/* Booking / Revenue trend chart */}
      <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
            {chartMode === 'bookings' ? '📅 Booking Trend' : '💰 Revenue Trend'}
          </div>
          <div style={{ display: 'flex', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <button onClick={() => setChartMode('bookings')} style={{ padding: '0.35rem 0.75rem', border: 'none', cursor: 'pointer', backgroundColor: chartMode === 'bookings' ? '#c9933a' : 'transparent', color: chartMode === 'bookings' ? '#0a0a0a' : '#888', fontWeight: '600', fontSize: '0.8rem' }}>Bookings</button>
            <button onClick={() => setChartMode('revenue')} style={{ padding: '0.35rem 0.75rem', border: 'none', cursor: 'pointer', backgroundColor: chartMode === 'revenue' ? '#4ade80' : 'transparent', color: chartMode === 'revenue' ? '#0a0a0a' : '#888', fontWeight: '600', fontSize: '0.8rem' }}>Revenue</button>
          </div>
        </div>
        {trend.every(t => t[chartMode] === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#555', fontSize: '0.9rem' }}>No {chartMode} data for this period yet</div>
        ) : (
          <MiniBarChart data={trend} valueKey={chartMode} color={chartMode === 'bookings' ? '#c9933a' : '#4ade80'} height={120} />
        )}
      </div>

      {/* Top services + Revenue by service */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '1.25rem' }}>🏆 Top Services</div>
          {topServices.length === 0
            ? <div style={{ color: '#555', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No bookings yet</div>
            : topServices.map(s => <HBar key={s.name} label={s.name} value={s.count} max={maxBookings} color="#c9933a" />)
          }
        </div>
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '1.25rem' }}>💵 Revenue by Service</div>
          {!isPro && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, #111 60%, transparent)', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#c9933a', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>🔒 Full breakdown — PRO only</div>
                <button onClick={onUpgrade} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.4rem 1rem', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>Upgrade</button>
              </div>
            </div>
          )}
          {revenueByService.length === 0
            ? <div style={{ color: '#555', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No revenue data yet</div>
            : revenueByService.map(s => <HBar key={s.name} label={s.name} value={s.revenue} max={maxRevenue} color="#4ade80" suffix="$" />)
          }
        </div>
      </div>

      {/* Profile views trend (PRO only) */}
      {isPro && (
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '1.25rem' }}>👁 Profile Views — {rangeLabel}</div>
          {viewTrend.every(v => v.views === 0)
            ? <div style={{ textAlign: 'center', padding: '2rem', color: '#555', fontSize: '0.9rem' }}>No profile views recorded yet.</div>
            : <MiniBarChart data={viewTrend} valueKey="views" color="#f472b6" height={120} />
          }
        </div>
      )}
    </div>
  )
}

// ── PORTFOLIO TAB ──────────────────────────────────────────────────────────────
function PortfolioTab({ getAuthHeaders, plan }: {
  getAuthHeaders: () => Promise<Record<string, string>>
  plan: string
}) {
  const [items, setItems] = useState<{ id: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const limit = PLAN_LIMITS[plan] ?? 5
  const atLimit = items.length >= limit

  useEffect(() => {
    const load = async () => {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/business/portfolio', { headers })
      const data = await res.json()
      if (data.portfolio) setItems(data.portfolio)
    }
    load()
  }, [])

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const handleUpload = async (file: File) => {
    if (atLimit) { showMsg(`${plan} plan limit reached (${limit} photos). Upgrade to add more.`); return }
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string
        const headers = await getAuthHeaders()
        const res = await fetch('/api/business/portfolio', { method: 'POST', headers, body: JSON.stringify({ image: base64 }) })
        const data = await res.json()
        if (data.success) { setItems(prev => [data.media, ...prev]); showMsg('✓ Photo uploaded!') }
        else showMsg(data.error || 'Upload failed')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch { showMsg('Upload failed'); setUploading(false) }
  }

  const handleDelete = async (id: string) => {
    const headers = await getAuthHeaders()
    await fetch('/api/business/portfolio', { method: 'DELETE', headers, body: JSON.stringify({ mediaId: id }) })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Our Work</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Showcase your best work — these appear prominently on your public profile.<br />
            <span style={{ color: limit === Infinity ? '#4ade80' : atLimit ? '#e05c5c' : '#c9933a' }}>
              {limit === Infinity ? `Unlimited photos (${plan} plan)` : `${items.length}/${limit} photos used (${plan} plan)`}
            </span>
          </p>
        </div>
        <label style={{ backgroundColor: atLimit ? '#333' : '#c9933a', color: atLimit ? '#666' : '#0a0a0a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', cursor: atLimit ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
          {uploading ? 'Uploading...' : '+ Add Photo'}
          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={atLimit} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
        </label>
      </div>
      {msg && <div style={{ color: msg.startsWith('✓') ? '#4ade80' : '#e05c5c', marginBottom: '1rem', fontWeight: '600', padding: '0.75rem 1rem', backgroundColor: msg.startsWith('✓') ? '#0a1f0a' : '#1f0a0a', borderRadius: '0.75rem' }}>{msg}</div>}
      {atLimit && plan !== 'PRO' && (
        <div style={{ backgroundColor: '#1a1200', border: '1px solid #c9933a44', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#c9933a', marginBottom: '0.25rem' }}>Limit reached</div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>Upgrade to {plan === 'FREE' ? 'Standard (20 photos) or Pro (unlimited)' : 'Pro for unlimited photos'}</div>
          </div>
          <button style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Upgrade</button>
        </div>
      )}
      <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && !atLimit) handleUpload(f) }}
        onClick={() => !atLimit && document.getElementById('portfolio-file-input')?.click()}
        style={{ border: '2px dashed #333', borderRadius: '1rem', padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '1.5rem', cursor: atLimit ? 'not-allowed' : 'pointer', opacity: atLimit ? 0.5 : 1 }}
        onMouseEnter={e => { if (!atLimit) e.currentTarget.style.borderColor = '#c9933a' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#333' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📸</div>
        <p style={{ fontWeight: '700', marginBottom: '0.4rem' }}>{uploading ? 'Uploading...' : 'Drag & drop or click to upload'}</p>
        <p style={{ color: '#888', fontSize: '0.8rem' }}>JPG, PNG — showcase your best work</p>
        <input id="portfolio-file-input" type="file" accept="image/*" style={{ display: 'none' }} disabled={atLimit} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
      </div>
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', aspectRatio: '1' as never, backgroundColor: '#111' }}>
              <img src={item.url} alt="portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => handleDelete(item.id)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.75)', border: 'none', color: '#e05c5c', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#555', fontSize: '0.9rem' }}>No portfolio photos yet — upload your first work sample above!</div>
      )}
    </div>
  )
}

// ── GALLERY TAB ────────────────────────────────────────────────────────────────
function GalleryTab({ getAuthHeaders, plan, saveButtonStyle }: {
  getAuthHeaders: () => Promise<Record<string, string>>
  plan: string
  saveButtonStyle: (color?: string) => React.CSSProperties
}) {
  const [media, setMedia] = useState<{ id: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const galleryLimit = GALLERY_LIMITS[plan] ?? 5
  const atLimit = media.length >= galleryLimit

  useEffect(() => {
    const load = async () => {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/business/gallery', { headers })
      const data = await res.json()
      if (data.media) setMedia(data.media)
    }
    load()
  }, [])

  const handleUpload = async (file: File) => {
    if (atLimit) { setMsg(`${plan} plan limit reached (${galleryLimit === Infinity ? '∞' : galleryLimit} photos)`); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string
      const headers = await getAuthHeaders()
      const res = await fetch('/api/business/gallery', { method: 'POST', headers, body: JSON.stringify({ image: base64 }) })
      const data = await res.json()
      if (data.success) { setMedia(prev => [...prev, data.media]); setMsg('✓ Photo uploaded!') }
      else setMsg(data.error || 'Upload failed')
      setTimeout(() => setMsg(''), 3000)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = async (mediaId: string) => {
    const headers = await getAuthHeaders()
    await fetch('/api/business/gallery', { method: 'DELETE', headers, body: JSON.stringify({ mediaId }) })
    setMedia(prev => prev.filter(m => m.id !== mediaId))
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Gallery</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Workspace photos — your shop, studio or setup. <span style={{ color: '#c9933a' }}>For work samples, use &quot;Our Work&quot; tab.</span></p>
        </div>
        <label style={{ ...saveButtonStyle(atLimit ? '#333' : '#c9933a'), cursor: atLimit ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'Uploading...' : '+ Upload'}
          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={atLimit} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
        </label>
      </div>
      {msg && <div style={{ color: msg.startsWith('✓') ? '#4ade80' : '#e05c5c', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>}
      {atLimit && plan !== 'PRO' && (
        <div style={{ backgroundColor: '#1a1200', border: '1px solid #c9933a44', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#c9933a', marginBottom: '0.25rem' }}>Gallery limit reached</div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>Upgrade to {plan === 'FREE' ? 'Standard (10 photos) or Pro (unlimited)' : 'Pro for unlimited gallery photos'}</div>
          </div>
          <button style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Upgrade</button>
        </div>
      )}
      <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && !atLimit) handleUpload(f) }}
        onClick={() => !atLimit && document.getElementById('gallery-upload')?.click()}
        style={{ border: '2px dashed #333', borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center', marginBottom: '1.5rem', cursor: atLimit ? 'not-allowed' : 'pointer', opacity: atLimit ? 0.5 : 1 }}
        onMouseEnter={e => { if (!atLimit) e.currentTarget.style.borderColor = '#c9933a' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#333' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
        <p style={{ fontWeight: '700', marginBottom: '0.5rem' }}>{uploading ? 'Uploading...' : 'Drag and drop or click'}</p>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>{media.length}/{galleryLimit === Infinity ? '∞' : galleryLimit} photos ({plan} plan)</p>
        <input id="gallery-upload" type="file" accept="image/*" style={{ display: 'none' }} disabled={atLimit} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
      </div>
      {media.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {media.map(m => (
            <div key={m.id} style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '4/3' as never }}>
              <img src={m.url} alt="gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => handleDelete(m.id)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#e05c5c', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── BOOKINGS TAB ───────────────────────────────────────────────────────────────
function BookingsTab({ getAuthHeaders }: { getAuthHeaders: () => Promise<Record<string, string>> }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    const load = async () => {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/business/bookings', { headers })
      const data = await res.json()
      if (data.bookings) setBookings(data.bookings)
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (bookingId: string, status: string) => {
    const headers = await getAuthHeaders()
    await fetch('/api/business/bookings', { method: 'PATCH', headers, body: JSON.stringify({ bookingId, status }) })
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
  }

  const filtered = filter === 'All' ? bookings : bookings.filter(b => b.status === filter.toUpperCase())

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Bookings</h1>
      <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Manage your incoming and upcoming bookings</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => {
          const count = status === 'All' ? bookings.length : bookings.filter(b => b.status === status.toUpperCase()).length
          return (
            <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid #333', backgroundColor: filter === status ? '#c9933a' : 'transparent', color: filter === status ? '#0a0a0a' : '#888', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {status}
              {count > 0 && <span style={{ backgroundColor: filter === status ? 'rgba(0,0,0,0.2)' : '#222', color: filter === status ? '#0a0a0a' : '#c9933a', borderRadius: '1rem', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: '800' }}>{count}</span>}
            </button>
          )
        })}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No bookings yet</h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>When clients book your services, they&apos;ll appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((booking: any) => (
            <div key={booking.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{booking.client?.fullName || 'Unknown'}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>{booking.client?.email}</div>
                </div>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: booking.status === 'CONFIRMED' ? '#0a1f0a' : booking.status === 'CANCELLED' ? '#1f0a0a' : booking.status === 'COMPLETED' ? '#0a0a1f' : '#1a1200', color: booking.status === 'CONFIRMED' ? '#4ade80' : booking.status === 'CANCELLED' ? '#e05c5c' : booking.status === 'COMPLETED' ? '#60a5fa' : '#c9933a' }}>{booking.status}</span>
              </div>
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ color: '#888' }}>Service</span><span style={{ fontWeight: '600' }}>{booking.service?.name || 'N/A'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ color: '#888' }}>Price</span><span style={{ color: '#c9933a', fontWeight: '700' }}>${booking.service?.price || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Date</span><span>{new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                {booking.notes && <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #222', color: '#888', fontSize: '0.8rem' }}>📝 {booking.notes}</div>}
              </div>
              {booking.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => updateStatus(booking.id, 'CONFIRMED')} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#0a1f0a', color: '#4ade80', fontWeight: '700', cursor: 'pointer' }}>✓ Confirm</button>
                  <button onClick={() => updateStatus(booking.id, 'CANCELLED')} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#1f0a0a', color: '#e05c5c', fontWeight: '700', cursor: 'pointer' }}>✕ Cancel</button>
                </div>
              )}
              {booking.status === 'CONFIRMED' && (
                <button onClick={() => updateStatus(booking.id, 'COMPLETED')} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#0a0a1f', color: '#60a5fa', fontWeight: '700', cursor: 'pointer' }}>Mark as Completed</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────────
export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [user, setUser] = useState<{ id?: string; email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [bookingStats, setBookingStats] = useState({ today: 0, total: 0, pending: 0 })
  const [currentPlan, setCurrentPlan] = useState('FREE')

  const [dashServices, setDashServices] = useState<{ id: number; name: string; price: string; duration: string; photo: string | null }[]>([])
  const [dashEmployees, setDashEmployees] = useState<{ id: number; name: string; specialty: string; bio: string; photo: string | null }[]>([])
  const [dashProfile, setDashProfile] = useState<{ name: string; phone: string; address: string; instagram: string; facebook: string; website: string; bio: string; coverPhoto: string | null; logo: string | null }>({ name: '', phone: '', address: '', instagram: '', facebook: '', website: '', bio: '', coverPhoto: null, logo: null })
  const [dashHours, setDashHours] = useState([
    { day: 'Monday', open: '09:00', close: '18:00', closed: false },
    { day: 'Tuesday', open: '09:00', close: '18:00', closed: false },
    { day: 'Wednesday', open: '09:00', close: '18:00', closed: false },
    { day: 'Thursday', open: '09:00', close: '18:00', closed: false },
    { day: 'Friday', open: '09:00', close: '18:00', closed: false },
    { day: 'Saturday', open: '10:00', close: '16:00', closed: false },
    { day: 'Sunday', open: '10:00', close: '16:00', closed: true },
  ])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else setUser(data.user)
    })
  }, [])

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) console.log('Auth userId:', session.user.id)
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` }
  }

  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      const headers = await getAuthHeaders()
      fetch('/api/business/services', { headers }).then(r => r.json()).then(data => { if (data.services?.length > 0) setDashServices(data.services.map((s: any) => ({ id: s.id, name: s.name, price: String(s.price), duration: String(s.duration), photo: null }))) }).catch(() => {})
      fetch('/api/business/hours', { headers }).then(r => r.json()).then(data => { if (data.hours?.length > 0) { const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; setDashHours(data.hours.map((h: any) => ({ day: days[h.dayOfWeek], open: h.openTime || '09:00', close: h.closeTime || '18:00', closed: h.isClosed }))) } }).catch(() => {})
      fetch('/api/business/employees', { headers }).then(r => r.json()).then(data => { if (data.employees?.length > 0) setDashEmployees(data.employees.map((e: any) => ({ id: e.id, name: e.name, specialty: e.specialty || '', bio: e.bio || '', photo: e.avatarUrl || null }))) }).catch(() => {})
      fetch('/api/business/profile', { headers }).then(r => r.json()).then(data => {
        if (data.business) {
          setCurrentPlan(data.business.subscription || 'FREE')
          setDashProfile({ name: data.business.name || '', phone: data.business.phone || '', address: data.business.address || '', instagram: data.business.instagram || '', facebook: data.business.facebook || '', website: data.business.website || '', bio: data.business.description || '', coverPhoto: data.business.media?.find((m: any) => m.caption === 'cover')?.url || null, logo: data.business.media?.find((m: any) => m.caption === 'logo')?.url || null })
        }
      }).catch(() => {})
      fetch('/api/business/bookings', { headers }).then(r => r.json()).then(data => {
        if (data.bookings) {
          const todayStr = new Date().toDateString()
          setBookingStats({ total: data.bookings.length, today: data.bookings.filter((b: any) => new Date(b.date).toDateString() === todayStr).length, pending: data.bookings.filter((b: any) => b.status === 'PENDING').length })
        }
      }).catch(() => {})
    }
    loadData()
  }, [user])

  const showSaveMsg = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000) }
  const saveServices = async () => { setSaving(true); try { const headers = await getAuthHeaders(); const res = await fetch('/api/business/services', { method: 'POST', headers, body: JSON.stringify({ services: dashServices }) }); const data = await res.json(); showSaveMsg(data.success ? '✓ Services saved!' : 'Failed') } catch { showSaveMsg('Error') } finally { setSaving(false) } }
  const saveHours = async () => { setSaving(true); try { const headers = await getAuthHeaders(); const res = await fetch('/api/business/hours', { method: 'POST', headers, body: JSON.stringify({ hours: dashHours }) }); const data = await res.json(); showSaveMsg(data.success ? '✓ Hours saved!' : 'Failed') } catch { showSaveMsg('Error') } finally { setSaving(false) } }
  const saveEmployees = async () => { setSaving(true); try { const headers = await getAuthHeaders(); const res = await fetch('/api/business/employees', { method: 'POST', headers, body: JSON.stringify({ employees: dashEmployees }) }); const data = await res.json(); showSaveMsg(data.success ? '✓ Employees saved!' : 'Failed') } catch { showSaveMsg('Error') } finally { setSaving(false) } }
  const saveProfile = async () => { setSaving(true); try { const headers = await getAuthHeaders(); const res = await fetch('/api/business/profile', { method: 'POST', headers, body: JSON.stringify(dashProfile) }); const data = await res.json(); showSaveMsg(data.success ? '✓ Profile saved!' : 'Failed') } catch { showSaveMsg('Error') } finally { setSaving(false) } }

  const handleUpgrade = async (plan: string) => {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers, body: JSON.stringify({ plan }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const handleManageBilling = async () => {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/stripe/portal', { method: 'POST', headers })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const businessName = dashProfile.name || user?.user_metadata?.business_name || 'My Business'
  const ownerName = user?.user_metadata?.full_name || user?.email || 'Owner'
  const completionPct = [dashProfile.phone, dashProfile.bio, dashProfile.address, dashServices.length > 0, dashHours.some(h => !h.closed)].filter(Boolean).length * 20

  const empLimit = EMPLOYEE_LIMITS[currentPlan] ?? 1
  const atEmpLimit = dashEmployees.length >= empLimit

  const inputStyle = { width: '100%', background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600' as const, color: '#888', marginBottom: '0.4rem' }
  const saveButtonStyle = (color = '#c9933a') => ({ backgroundColor: saving ? '#7a5820' : color, color: color === '#333' ? '#666' : '#0a0a0a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700' as const, cursor: saving ? 'not-allowed' as const : 'pointer' as const, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' })
  const navStyle = (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: active ? '#c9933a' : 'transparent', color: active ? '#0a0a0a' : '#888', fontWeight: active ? '700' : '500' as const, fontSize: '0.9rem', border: 'none', width: '100%', textAlign: 'left' as const })
  const Spinner = () => <span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #222', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
          <span style={{ color: '#333' }}>|</span>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Business Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {saveMsg && <span style={{ color: saveMsg.startsWith('✓') ? '#4ade80' : '#e05c5c', fontSize: '0.85rem', fontWeight: '600' }}>{saveMsg}</span>}
          {bookingStats.pending > 0 && (
            <button onClick={() => setActiveTab('bookings')} style={{ background: '#1a1200', border: '1px solid #c9933a', color: '#c9933a', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>🔔 {bookingStats.pending} pending</button>
          )}
          <Link href="/business/preview" style={{ border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', textDecoration: 'none', fontSize: '0.85rem' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>👁 Preview Profile</Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Sign Out</button>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#c9933a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', color: '#0a0a0a' }}>{ownerName.charAt(0).toUpperCase()}</div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR */}
        <aside style={{ width: sidebarOpen ? '220px' : '64px', borderRight: '1px solid #222', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', transition: 'width 0.3s ease', flexShrink: 0, overflow: 'hidden', position: 'sticky', top: '57px', height: 'calc(100vh - 57px)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '1rem', padding: '0.5rem', marginBottom: '0.5rem', textAlign: 'right' as const }} onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.color = '#555')}>{sidebarOpen ? '◀' : '▶'}</button>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={navStyle(activeTab === item.id)}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <span style={{ whiteSpace: 'nowrap', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {item.label}
                  {item.id === 'bookings' && bookingStats.pending > 0 && (
                    <span style={{ backgroundColor: activeTab === 'bookings' ? 'rgba(0,0,0,0.25)' : '#c9933a', color: '#0a0a0a', borderRadius: '1rem', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: '800' }}>{bookingStats.pending}</span>
                  )}
                </span>
              )}
            </button>
          ))}
          {sidebarOpen && (
            <div style={{ marginTop: 'auto', padding: '0.75rem', backgroundColor: '#111', borderRadius: '0.75rem', border: '1px solid #222' }}>
              <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Current Plan</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c9933a' }}>{currentPlan}</div>
              {currentPlan !== 'PRO' && <button onClick={() => setActiveTab('settings')} style={{ marginTop: '0.5rem', width: '100%', padding: '0.4rem', backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Upgrade ↑</button>}
            </div>
          )}
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '1000px' }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Welcome, {ownerName.split(' ')[0]} 👋</h1>
              <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Here&apos;s how <span style={{ color: '#c9933a' }}>{businessName}</span> is doing</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: "Today's Bookings", value: String(bookingStats.today), icon: '📅', color: '#c9933a', tab: 'bookings' as Tab },
                  { label: 'Total Bookings', value: String(bookingStats.total), icon: '✅', color: '#4ade80', tab: 'bookings' as Tab },
                  { label: 'Pending', value: String(bookingStats.pending), icon: '⏳', color: '#f59e0b', tab: 'bookings' as Tab },
                  { label: 'Analytics', value: '→', icon: '📈', color: '#a78bfa', tab: 'analytics' as Tab },
                ].map(stat => (
                  <div key={stat.label} onClick={() => stat.tab && setActiveTab(stat.tab)} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9933a' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#222' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#888', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Edit Profile', icon: '✏️', tab: 'profile' as Tab },
                  { label: 'Upload Portfolio', icon: '🖼️', tab: 'portfolio' as Tab },
                  { label: 'Manage Bookings', icon: '📅', tab: 'bookings' as Tab },
                  { label: 'Add Services', icon: '📋', tab: 'services' as Tab },
                  { label: 'Set Hours', icon: '🕐', tab: 'hours' as Tab },
                  { label: 'View Analytics', icon: '📈', tab: 'analytics' as Tab },
                ].map(action => (
                  <button key={action.label} onClick={() => setActiveTab(action.tab)} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f5f0e8', textAlign: 'left' as const }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                    <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{action.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontWeight: '700', fontSize: '1rem' }}>Profile Completion</h2>
                  <span style={{ color: '#c9933a', fontWeight: '700' }}>{completionPct}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', marginBottom: '1rem' }}>
                  <div style={{ width: `${completionPct}%`, height: '100%', backgroundColor: '#c9933a', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
                {[{ label: 'Account created', done: true }, { label: 'Add phone number', done: !!dashProfile.phone }, { label: 'Write your bio', done: !!dashProfile.bio }, { label: 'Add services', done: dashServices.length > 0 }, { label: 'Set business hours', done: dashHours.some(h => !h.closed) }].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: item.done ? '#4ade80' : '#555' }}>{item.done ? '✓' : '○'}</span>
                    <span style={{ color: item.done ? '#f5f0e8' : '#888' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && <BookingsTab getAuthHeaders={getAuthHeaders} />}
          {activeTab === 'portfolio' && <PortfolioTab getAuthHeaders={getAuthHeaders} plan={currentPlan} />}
          {activeTab === 'gallery' && <GalleryTab getAuthHeaders={getAuthHeaders} plan={currentPlan} saveButtonStyle={saveButtonStyle} />}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <AnalyticsTab
              getAuthHeaders={getAuthHeaders}
              plan={currentPlan}
              userId={user?.id || null}
              onUpgrade={() => setActiveTab('settings')}
            />
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div><h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Edit Profile</h1><p style={{ color: '#888', fontSize: '0.9rem' }}>Update your business information</p></div>
                <button onClick={saveProfile} style={saveButtonStyle()}>{saving ? <><Spinner />Saving...</> : saveMsg || 'Save Profile'}</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '1.25rem', fontSize: '0.95rem' }}>Cover Photo & Logo</h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Cover Photo</label>
                    <div onClick={() => document.getElementById('cover-upload')?.click()} style={{ height: '120px', borderRadius: '0.75rem', border: '2px dashed #444', cursor: 'pointer', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#444')}>
                      {dashProfile.coverPhoto ? <img src={dashProfile.coverPhoto} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>🖼️</div><div style={{ fontSize: '0.8rem', color: '#888' }}>Click to upload cover</div></div>}
                      <input id="cover-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setDashProfile(p => ({ ...p, coverPhoto: ev.target?.result as string })); r.readAsDataURL(f) } }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Logo</label>
                    <div onClick={() => document.getElementById('logo-upload')?.click()} style={{ width: '80px', height: '80px', borderRadius: '0.75rem', border: '2px dashed #444', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#444')}>
                      {dashProfile.logo ? <img src={dashProfile.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', fontSize: '1.5rem' }}>🏪</div>}
                      <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setDashProfile(p => ({ ...p, logo: ev.target?.result as string })); r.readAsDataURL(f) } }} />
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.95rem' }}>Business Info</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[{ label: 'Business Name', key: 'name', placeholder: 'Your business name' }, { label: 'Phone Number', key: 'phone', placeholder: '+1 (416) 000-0000' }, { label: 'Address', key: 'address', placeholder: 'e.g. Little Ethiopia, Toronto' }].map(f => (
                      <div key={f.key}><label style={labelStyle}>{f.label}</label><input type="text" value={dashProfile[f.key as keyof typeof dashProfile] as string} onChange={e => setDashProfile(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                    ))}
                    <div><label style={labelStyle}>Bio</label><textarea value={dashProfile.bio} onChange={e => setDashProfile(p => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Tell clients about your business..." style={{ ...inputStyle, resize: 'vertical' as const }} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.95rem' }}>Social & Contact</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[{ label: 'Instagram', key: 'instagram', placeholder: '@yourhandle' }, { label: 'Facebook', key: 'facebook', placeholder: 'facebook.com/yourpage' }, { label: 'Website', key: 'website', placeholder: 'yourwebsite.com' }].map(f => (
                      <div key={f.key}><label style={labelStyle}>{f.label}</label><input type="text" value={dashProfile[f.key as keyof typeof dashProfile] as string} onChange={e => setDashProfile(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEES */}
          {activeTab === 'employees' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div><h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Employees</h1><p style={{ color: '#888', fontSize: '0.9rem' }}>Each employee has their own photo, specialty and schedule</p></div>
                <button onClick={() => {
                  if (atEmpLimit) { showSaveMsg(`${currentPlan} plan limit: ${empLimit === Infinity ? '∞' : empLimit} employees max. Upgrade to add more.`); return }
                  setDashEmployees(prev => [...prev, { id: Date.now(), name: '', specialty: '', bio: '', photo: null }])
                }} style={saveButtonStyle(atEmpLimit ? '#333' : '#c9933a')}>+ Add Employee</button>
              </div>
              {atEmpLimit && currentPlan !== 'PRO' && (
                <div style={{ backgroundColor: '#1a1200', border: '1px solid #c9933a44', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#c9933a', marginBottom: '0.25rem' }}>Employee limit reached</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>Upgrade to {currentPlan === 'FREE' ? 'Standard (3 employees) or Pro (unlimited)' : 'Pro for unlimited employees'}</div>
                  </div>
                  <button onClick={() => setActiveTab('settings')} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Upgrade</button>
                </div>
              )}
              {dashEmployees.length === 0 ? (
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No employees yet</h3>
                  <button onClick={() => setDashEmployees([{ id: Date.now(), name: '', specialty: '', bio: '', photo: null }])} style={saveButtonStyle()}>+ Add First Employee</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {dashEmployees.map((emp, i) => (
                    <div key={emp.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#c9933a' }}>Employee {i + 1}</span><button onClick={() => setDashEmployees(prev => prev.filter(e => e.id !== emp.id))} style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1.25rem', alignItems: 'start' }}>
                        <div>
                          <label style={labelStyle}>Photo</label>
                          <div onClick={() => document.getElementById(`emp-photo-${emp.id}`)?.click()} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed #444', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#444')}>
                            {emp.photo ? <img src={emp.photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.75rem' }}>👤</div></div>}
                            <input id={`emp-photo-${emp.id}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setDashEmployees(prev => prev.map(em => em.id === emp.id ? { ...em, photo: ev.target?.result as string } : em)); r.readAsDataURL(f) } }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div><label style={labelStyle}>Full Name</label><input type="text" value={emp.name} onChange={e => setDashEmployees(prev => prev.map(em => em.id === emp.id ? { ...em, name: e.target.value } : em))} placeholder="e.g. Selam Tesfaye" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                          <div><label style={labelStyle}>Specialty</label><input type="text" value={emp.specialty} onChange={e => setDashEmployees(prev => prev.map(em => em.id === emp.id ? { ...em, specialty: e.target.value } : em))} placeholder="e.g. Braiding & Natural Hair" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                          <div><label style={labelStyle}>Short Bio</label><textarea value={emp.bio} onChange={e => setDashEmployees(prev => prev.map(em => em.id === emp.id ? { ...em, bio: e.target.value } : em))} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={saveEmployees} style={{ ...saveButtonStyle(), width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem', marginTop: '0.5rem' }}>{saving ? <><Spinner />Saving...</> : saveMsg || 'Save Employees'}</button>
                </div>
              )}
            </div>
          )}

          {/* SERVICES */}
          {activeTab === 'services' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div><h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Services</h1><p style={{ color: '#888', fontSize: '0.9rem' }}>Add services with pricing and duration</p></div>
                <button onClick={() => setDashServices(prev => [...prev, { id: Date.now(), name: '', price: '', duration: '', photo: null }])} style={saveButtonStyle()}>+ Add Service</button>
              </div>
              {dashServices.length === 0 ? (
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <button onClick={() => setDashServices([{ id: Date.now(), name: '', price: '', duration: '', photo: null }])} style={saveButtonStyle()}>+ Add First Service</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {dashServices.map((service, i) => (
                    <div key={service.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><span style={{ fontWeight: '600', color: '#c9933a' }}>Service {i + 1}</span><button onClick={() => setDashServices(prev => prev.filter(s => s.id !== service.id))} style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer' }}>Remove</button></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div><label style={labelStyle}>Service Name</label><input type="text" value={service.name} onChange={e => setDashServices(prev => prev.map(s => s.id === service.id ? { ...s, name: e.target.value } : s))} placeholder="e.g. Hair Braiding" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div><label style={labelStyle}>Price (CAD)</label><input type="number" value={service.price} onChange={e => setDashServices(prev => prev.map(s => s.id === service.id ? { ...s, price: e.target.value } : s))} placeholder="80" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                          <div><label style={labelStyle}>Duration (mins)</label><input type="number" value={service.duration} onChange={e => setDashServices(prev => prev.map(s => s.id === service.id ? { ...s, duration: e.target.value } : s))} placeholder="60" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={saveServices} style={{ ...saveButtonStyle(), width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}>{saving ? <><Spinner />Saving...</> : saveMsg || 'Save Services'}</button>
                </div>
              )}
            </div>
          )}

          {/* HOURS */}
          {activeTab === 'hours' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div><h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Business Hours</h1><p style={{ color: '#888', fontSize: '0.9rem' }}>Set when clients can book</p></div>
                <button onClick={saveHours} style={saveButtonStyle()}>{saving ? <><Spinner />Saving...</> : saveMsg || 'Save Hours'}</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dashHours.map((h, i) => (
                  <div key={h.day} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px', alignItems: 'center', gap: '1rem', opacity: h.closed ? 0.5 : 1 }}>
                    <span style={{ fontWeight: '600' }}>{h.day}</span>
                    <input type="time" value={h.open} disabled={h.closed} onChange={e => setDashHours(prev => prev.map((d, idx) => idx === i ? { ...d, open: e.target.value } : d))} style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#f5f0e8', outline: 'none' }} />
                    <input type="time" value={h.close} disabled={h.closed} onChange={e => setDashHours(prev => prev.map((d, idx) => idx === i ? { ...d, close: e.target.value } : d))} style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#f5f0e8', outline: 'none' }} />
                    <button onClick={() => setDashHours(prev => prev.map((d, idx) => idx === i ? { ...d, closed: !d.closed } : d))} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: h.closed ? '#c9933a' : '#333', color: h.closed ? '#0a0a0a' : '#888', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>{h.closed ? 'Closed' : 'Open'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Settings</h1>
              <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Manage your subscription and account</p>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#888', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subscription Plans</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { name: 'FREE', label: 'Free', price: '$0', period: 'forever', features: ['5 portfolio photos', '5 gallery photos', '1 employee', 'Basic profile', 'Contact info'], color: '#888' },
                  { name: 'STANDARD', label: 'Standard', price: '$19', period: 'per month', features: ['20 portfolio photos', '10 gallery photos', 'Up to 3 employees', 'Basic analytics', 'Booking system'], color: '#60a5fa' },
                  { name: 'PRO', label: 'Pro', price: '$39', period: 'per month', features: ['Unlimited portfolio photos', 'Unlimited gallery photos', 'Unlimited employees', 'Advanced analytics', 'Verified badge ✓'], color: '#c9933a' },
                ].map(plan => (
                  <div key={plan.name} style={{ backgroundColor: '#111', border: `2px solid ${currentPlan === plan.name ? plan.color : '#222'}`, borderRadius: '1rem', padding: '1.5rem', position: 'relative' as const }}>
                    {currentPlan === plan.name && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: plan.color, color: '#0a0a0a', padding: '0.2rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700' }}>Current Plan</div>}
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: plan.color, marginBottom: '0.5rem' }}>{plan.label}</div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>{plan.price}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.25rem' }}>{plan.period}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                      {plan.features.map(f => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#ccc' }}><span style={{ color: plan.color }}>✓</span> {f}</div>)}
                    </div>
                    {currentPlan === plan.name ? (
                      plan.name !== 'FREE' && (
                        <button onClick={handleManageBilling} style={{ width: '100%', backgroundColor: '#222', color: '#f5f0e8', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Manage Billing</button>
                      )
                    ) : (
                      plan.name !== 'FREE' && (
                        <button onClick={() => handleUpgrade(plan.name)} style={{ width: '100%', backgroundColor: plan.color === '#c9933a' ? '#c9933a' : '#222', color: plan.color === '#c9933a' ? '#0a0a0a' : '#f5f0e8', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Upgrade to {plan.label}</button>
                      )
                    )}
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor: '#111', border: '1px solid #e05c5c33', borderRadius: '1rem', padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', color: '#e05c5c', marginBottom: '1rem' }}>Danger Zone</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><p style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Delete Business Account</p><p style={{ color: '#888', fontSize: '0.85rem' }}>Permanently removes your business from Meda</p></div>
                  <button style={{ backgroundColor: 'transparent', border: '1px solid #e05c5c', color: '#e05c5c', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                </div>
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