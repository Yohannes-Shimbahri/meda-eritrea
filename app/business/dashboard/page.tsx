'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Tab = 'overview' | 'bookings' | 'profile' | 'gallery' | 'employees' | 'services' | 'hours' | 'settings'

const navItems: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'bookings', icon: '📅', label: 'Bookings' },
  { id: 'profile', icon: '✏️', label: 'Profile' },
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'employees', icon: '👥', label: 'Employees' },
  { id: 'services', icon: '💼', label: 'Services' },
  { id: 'hours', icon: '🕐', label: 'Hours' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dashServices, setDashServices] = useState<{
    id: number; name: string; price: string; duration: string; photo: string | null
  }[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else setUser(data.user)
    })
  }, [])

  const businessName = user?.user_metadata?.business_name || 'My Business'
  const ownerName = user?.user_metadata?.full_name || user?.email || 'Owner'

  const navStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1rem', borderRadius: '0.75rem',
    cursor: 'pointer', transition: 'all 0.2s',
    backgroundColor: active ? '#c9933a' : 'transparent',
    color: active ? '#0a0a0a' : '#888',
    fontWeight: active ? '700' : '500' as const,
    fontSize: '0.9rem', border: 'none', width: '100%', textAlign: 'left' as const,
  })

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>

      {/* TOP NAVBAR */}
      <nav style={{
        borderBottom: '1px solid #222', padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 200,
        backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* MOBILE HAMBURGER */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '1.25rem', display: 'none' }}>
            ☰
          </button>
          <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
          <span style={{ color: '#333' }}>|</span>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Business Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/business/preview`} style={{
            border: '1px solid #333', color: '#888', padding: '0.5rem 1rem',
            borderRadius: '0.75rem', textDecoration: 'none', fontSize: '0.85rem',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>
            👁 Preview Profile
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            Sign Out
          </button>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            backgroundColor: '#c9933a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '0.85rem', color: '#0a0a0a', flexShrink: 0,
          }}>
            {ownerName.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* SIDEBAR */}
        <aside style={{
          width: sidebarOpen ? '220px' : '64px',
          borderRight: '1px solid #222',
          padding: '1.25rem 0.75rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
          transition: 'width 0.3s ease',
          flexShrink: 0, overflow: 'hidden',
          position: 'sticky', top: '57px', height: 'calc(100vh - 57px)',
        }}>
          {/* COLLAPSE BUTTON */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#555', fontSize: '1rem', padding: '0.5rem',
            marginBottom: '0.5rem', textAlign: 'right' as const,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={navStyle(activeTab === item.id)}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}

          {/* BOTTOM — Subscription badge */}
          {sidebarOpen && (
            <div style={{ marginTop: 'auto', padding: '0.75rem', backgroundColor: '#111', borderRadius: '0.75rem', border: '1px solid #222' }}>
              <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Current Plan</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c9933a' }}>Free Tier</div>
              <button onClick={() => setActiveTab('settings')} style={{
                marginTop: '0.5rem', width: '100%', padding: '0.4rem',
                backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
              }}>
                Upgrade ↑
              </button>
            </div>
          )}
        </aside>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 150,
            backgroundColor: 'rgba(0,0,0,0.8)',
          }} onClick={() => setMobileMenuOpen(false)}>
            <div style={{
              width: '240px', height: '100%', backgroundColor: '#111',
              borderRight: '1px solid #222', padding: '1.5rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#c9933a', marginBottom: '1rem', padding: '0 0.5rem' }}>
                {businessName}
              </div>
              {navItems.map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                  style={navStyle(activeTab === item.id)}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '1000px' }}>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>
                Welcome, {ownerName.split(' ')[0]} 👋
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Here's how <span style={{ color: '#c9933a' }}>{businessName}</span> is doing
              </p>

              {/* STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: "Today's Bookings", value: '0', icon: '📅', color: '#c9933a' },
                  { label: 'Total Bookings', value: '0', icon: '✅', color: '#4ade80' },
                  { label: 'Profile Views', value: '0', icon: '👁', color: '#60a5fa' },
                  { label: 'Messages', value: '0', icon: '💬', color: '#f472b6' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    backgroundColor: '#111', border: '1px solid #222',
                    borderRadius: '1rem', padding: '1.25rem',
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* QUICK ACTIONS */}
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#888', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Edit Profile', icon: '✏️', tab: 'profile' as Tab },
                  { label: 'Upload Photos', icon: '📸', tab: 'gallery' as Tab },
                  { label: 'Manage Bookings', icon: '📅', tab: 'bookings' as Tab },
                  { label: 'Add Services', icon: '💼', tab: 'services' as Tab },
                  { label: 'Set Hours', icon: '🕐', tab: 'hours' as Tab },
                  { label: 'Add Employee', icon: '👥', tab: 'employees' as Tab },
                ].map(action => (
                  <button key={action.label} onClick={() => setActiveTab(action.tab)} style={{
                    backgroundColor: '#111', border: '1px solid #222',
                    borderRadius: '1rem', padding: '1.25rem',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    color: '#f5f0e8', textAlign: 'left' as const,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                    <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* PROFILE COMPLETION */}
              <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontWeight: '700', fontSize: '1rem' }}>Profile Completion</h2>
                  <span style={{ color: '#c9933a', fontWeight: '700' }}>20%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', marginBottom: '1rem' }}>
                  <div style={{ width: '20%', height: '100%', backgroundColor: '#c9933a', borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { label: 'Account created', done: true },
                    { label: 'Add profile photo', done: false },
                    { label: 'Write your bio', done: false },
                    { label: 'Add services', done: false },
                    { label: 'Set business hours', done: false },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <span style={{ color: item.done ? '#4ade80' : '#555', fontSize: '1rem' }}>
                        {item.done ? '✓' : '○'}
                      </span>
                      <span style={{ color: item.done ? '#f5f0e8' : '#888' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Bookings</h1>
              <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Manage your incoming and upcoming bookings</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => (
                  <button key={status} style={{
                    padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid #333',
                    backgroundColor: status === 'All' ? '#c9933a' : 'transparent',
                    color: status === 'All' ? '#0a0a0a' : '#888',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                  }}>{status}</button>
                ))}
              </div>
              <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No bookings yet</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>When clients book your services, they'll appear here</p>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Edit Profile</h1>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>Changes are saved as draft until you publish</p>
                </div>
                <button style={{
                  backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  Publish Changes
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* AVATAR */}
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.95rem' }}>Business Photo</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      backgroundColor: '#222', border: '2px dashed #444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.75rem',
                    }}>📸</div>
                    <div>
                      <button style={{
                        backgroundColor: '#222', color: '#f5f0e8', border: '1px solid #333',
                        padding: '0.5rem 1rem', borderRadius: '0.75rem',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                      }}>Upload Photo</button>
                      <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.4rem' }}>JPG or PNG, max 5MB</p>
                    </div>
                  </div>
                </div>
                {/* INFO */}
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.95rem' }}>Business Info</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { label: 'Business Name', placeholder: businessName, type: 'text' },
                      { label: 'Phone Number', placeholder: '+1 (416) 000-0000', type: 'tel' },
                      { label: 'Address / Neighborhood', placeholder: 'e.g. Little Ethiopia, Toronto', type: 'text' },
                    ].map(field => (
                      <div key={field.label}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#888', marginBottom: '0.4rem' }}>{field.label}</label>
                        <input type={field.type} placeholder={field.placeholder} style={{
                          width: '100%', background: '#0a0a0a', border: '1px solid #333',
                          borderRadius: '0.75rem', padding: '0.75rem 1rem',
                          color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
                        }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#888', marginBottom: '0.4rem' }}>Bio</label>
                      <textarea placeholder="Tell clients about your business..." rows={4} style={{
                        width: '100%', background: '#0a0a0a', border: '1px solid #333',
                        borderRadius: '0.75rem', padding: '0.75rem 1rem',
                        color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box' as const, resize: 'vertical' as const,
                      }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                    </div>
                  </div>
                </div>
                {/* SOCIAL */}
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.95rem' }}>Social & Contact</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {['Instagram', 'Facebook', 'Website', 'Email'].map(field => (
                      <div key={field}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#888', marginBottom: '0.4rem' }}>{field}</label>
                        <input type="text" placeholder={`Your ${field.toLowerCase()}`} style={{
                          width: '100%', background: '#0a0a0a', border: '1px solid #333',
                          borderRadius: '0.75rem', padding: '0.75rem 1rem',
                          color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
                        }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── GALLERY ── */}
          {activeTab === 'gallery' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Gallery</h1>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>Upload photos and videos of your work</p>
                </div>
                <button style={{
                  backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                }}>+ Upload</button>
              </div>
              <div style={{
                border: '2px dashed #333', borderRadius: '1rem',
                padding: '4rem 2rem', textAlign: 'center', marginBottom: '1.5rem',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                <p style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Drag and drop or click to upload</p>
                <p style={{ color: '#888', fontSize: '0.85rem' }}>JPG, PNG, MP4 — Max 50MB per file</p>
                <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.5rem' }}>Free plan: up to 5 photos</p>
              </div>
            </div>
          )}

          {/* ── EMPLOYEES ── */}
          {activeTab === 'employees' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Employees</h1>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>Manage your team and their schedules</p>
                </div>
                <button style={{
                  backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                }}>+ Add Employee</button>
              </div>
              <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No employees yet</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Add team members so clients can choose their preferred person</p>
                <button style={{
                  backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  fontWeight: '700', cursor: 'pointer',
                }}>+ Add First Employee</button>
              </div>
            </div>
          )}

          {/* ── SERVICES ── */}
          {activeTab === 'services' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Services</h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Add services with photos, pricing and duration</p>
                </div>
                <button
                    onClick={() => {
                    const newService = { id: Date.now(), name: '', price: '', duration: '', photo: null as string | null }
                    setDashServices(prev => [...prev, newService])
                    }}
                    style={{
                    backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                    fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                    }}>+ Add Service</button>
                </div>

                {dashServices.length === 0 ? (
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
                    <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No services yet</h3>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Add your services so clients know what you offer</p>
                </div>
                ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {dashServices.map((service, i) => (
                    <div key={service.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#c9933a' }}>Service {i + 1}</span>
                        <button onClick={() => setDashServices(prev => prev.filter(s => s.id !== service.id))}
                            style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Remove
                        </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.25rem', alignItems: 'start' }}>
                        {/* PHOTO UPLOAD */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#888', marginBottom: '0.4rem' }}>Service Photo</label>
                            <div
                            onClick={() => document.getElementById(`service-photo-${service.id}`)?.click()}
                            style={{
                                width: '120px', height: '120px', borderRadius: '0.75rem',
                                border: '2px dashed #444', cursor: 'pointer',
                                overflow: 'hidden', position: 'relative',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: '#0a0a0a', transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#444')}>
                            {service.photo ? (
                                <>
                                <img src={service.photo} alt="service" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: 0, transition: 'opacity 0.2s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600' }}>Change</span>
                                </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📸</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Add Photo</div>
                                </div>
                            )}
                            <input
                                id={`service-photo-${service.id}`}
                                type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    const reader = new FileReader()
                                    reader.onload = ev => {
                                    setDashServices(prev => prev.map(s =>
                                        s.id === service.id ? { ...s, photo: ev.target?.result as string } : s
                                    ))
                                    }
                                    reader.readAsDataURL(file)
                                }
                                }}
                            />
                            </div>
                        </div>

                        {/* SERVICE FIELDS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#888', marginBottom: '0.4rem' }}>Service Name</label>
                            <input type="text" value={service.name}
                                onChange={e => setDashServices(prev => prev.map(s => s.id === service.id ? { ...s, name: e.target.value } : s))}
                                placeholder="e.g. Hair Braiding" style={{
                                width: '100%', background: '#0a0a0a', border: '1px solid #333',
                                borderRadius: '0.75rem', padding: '0.75rem 1rem',
                                color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#888', marginBottom: '0.4rem' }}>Price (CAD)</label>
                                <input type="number" value={service.price}
                                onChange={e => setDashServices(prev => prev.map(s => s.id === service.id ? { ...s, price: e.target.value } : s))}
                                placeholder="e.g. 80" style={{
                                    width: '100%', background: '#0a0a0a', border: '1px solid #333',
                                    borderRadius: '0.75rem', padding: '0.75rem 1rem',
                                    color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#888', marginBottom: '0.4rem' }}>Duration (mins)</label>
                                <input type="number" value={service.duration}
                                onChange={e => setDashServices(prev => prev.map(s => s.id === service.id ? { ...s, duration: e.target.value } : s))}
                                placeholder="e.g. 60" style={{
                                    width: '100%', background: '#0a0a0a', border: '1px solid #333',
                                    borderRadius: '0.75rem', padding: '0.75rem 1rem',
                                    color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    ))}

                    {/* SAVE BUTTON */}
                    <button style={{
                    backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                    padding: '1rem', borderRadius: '0.75rem', fontWeight: '700',
                    fontSize: '1rem', cursor: 'pointer', width: '100%', marginTop: '0.5rem',
                    }}>
                    Save Services
                    </button>
                </div>
                )}
            </div>
            )}

          {/* ── HOURS ── */}
          {activeTab === 'hours' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Business Hours</h1>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>Set when clients can book appointments</p>
                </div>
                <button style={{
                  backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                }}>Save Hours</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                  <div key={day} style={{
                    backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem',
                    padding: '1rem 1.25rem', display: 'grid',
                    gridTemplateColumns: '120px 1fr 1fr 80px', alignItems: 'center', gap: '1rem',
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{day}</span>
                    <input type="time" defaultValue="09:00" style={{
                      background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem', color: '#f5f0e8', outline: 'none',
                    }} />
                    <input type="time" defaultValue="18:00" style={{
                      background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem', color: '#f5f0e8', outline: 'none',
                    }} />
                    <button style={{
                      padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                      backgroundColor: i === 6 ? '#c9933a' : '#333',
                      color: i === 6 ? '#0a0a0a' : '#888',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                    }}>
                      {i === 6 ? 'Closed' : 'Open'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Settings</h1>
              <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Manage your subscription and account settings</p>

              {/* SUBSCRIPTION CARDS */}
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#888', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subscription Plans</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { name: 'Free', price: '$0', period: 'forever', features: ['5 photos', 'Basic profile', 'Show contact info'], current: true, color: '#888' },
                  { name: 'Standard', price: '$19', period: 'per month', features: ['20 photos + 3 videos', 'In-platform chat', 'Booking system', 'Up to 3 employees', 'Basic analytics'], current: false, color: '#60a5fa' },
                  { name: 'Pro', price: '$39', period: 'per month', features: ['Unlimited media', 'Featured placement', 'Unlimited employees', 'Advanced analytics', 'Verified badge ✓'], current: false, color: '#c9933a' },
                ].map(plan => (
                  <div key={plan.name} style={{
                    backgroundColor: '#111', border: `2px solid ${plan.current ? plan.color : '#222'}`,
                    borderRadius: '1rem', padding: '1.5rem',
                    position: 'relative' as const,
                  }}>
                    {plan.current && (
                      <div style={{
                        position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: '#888', color: '#0a0a0a',
                        padding: '0.2rem 0.75rem', borderRadius: '1rem',
                        fontSize: '0.75rem', fontWeight: '700',
                      }}>Current Plan</div>
                    )}
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: plan.color, marginBottom: '0.5rem' }}>{plan.name}</div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>{plan.price}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.25rem' }}>{plan.period}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#ccc' }}>
                          <span style={{ color: plan.color }}>✓</span> {f}
                        </div>
                      ))}
                    </div>
                    {!plan.current && (
                      <button style={{
                        width: '100%', backgroundColor: plan.color === '#c9933a' ? '#c9933a' : '#222',
                        color: plan.color === '#c9933a' ? '#0a0a0a' : '#f5f0e8',
                        border: 'none', padding: '0.75rem', borderRadius: '0.75rem',
                        fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                      }}>
                        Upgrade to {plan.name}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* DANGER ZONE */}
              <div style={{ backgroundColor: '#111', border: '1px solid #e05c5c33', borderRadius: '1rem', padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', color: '#e05c5c', marginBottom: '1rem' }}>Danger Zone</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Delete Business Account</p>
                    <p style={{ color: '#888', fontSize: '0.85rem' }}>This will permanently remove your business from Meda</p>
                  </div>
                  <button style={{
                    backgroundColor: 'transparent', border: '1px solid #e05c5c', color: '#e05c5c',
                    padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem',
                  }}>Delete</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
          aside { display: none !important; }
        }
      `}</style>
    </div>
  )
}