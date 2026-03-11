'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const cities = ['All Cities', 'Toronto', 'Calgary', 'Edmonton', 'Ottawa', 'Vancouver', 'Montreal']

type Subcategory = {
  id: string
  name: string
  slug: string
  icon: string
}

type Category = {
  id: string
  name: string
  slug: string
  icon: string
  imageUrl: string | null
  description: string | null
  subcategories: Subcategory[]
}

type Business = {
  id: string
  name: string
  slug: string
  categoryId: string | null
  subcategoryId: string | null
  city: string
  subscription: string
  isVerified: boolean
  coverImage: string | null
  rating: number | null
  reviewCount: number
}

function getCategoryEmoji(name: string) {
  const map: Record<string, string> = {
    'Hair Styling': '✂️', 'Barber': '💈', 'Makeup': '💄',
    'Catering': '🍽️', 'Cameraman': '📸', 'Baker': '🍞',
    'Car Sales': '🚗', 'Event Decoration': '🎊', 'Handy Services': '🔧',
  }
  return map[name] || '🏪'
}

function CategoryBrowseContent() {
  const params = useParams()
  const categorySlug = params?.category as string

  const [category, setCategory] = useState<Category | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBiz, setLoadingBiz] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [city, setCity] = useState('All Cities')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user)
    })
  }, [])

  // Load category info
  useEffect(() => {
    if (!categorySlug) return
    fetch(`/api/admin/categories?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const found = data.categories?.find((c: Category) => c.slug === categorySlug)
        setCategory(found || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categorySlug])

  // Load businesses
  useEffect(() => {
    if (!category) return
    setLoadingBiz(true)
    const params = new URLSearchParams()
    params.set('category', categorySlug)
    if (activeTab !== 'all') params.set('subcategory', activeTab)
    if (city !== 'All Cities') params.set('city', city)
    if (search) params.set('search', search)

    const t = setTimeout(() => {
      fetch(`/api/businesses?${params}`)
        .then(r => r.json())
        .then(data => {
          setBusinesses(data.businesses || [])
          setLoadingBiz(false)
        })
        .catch(() => setLoadingBiz(false))
    }, 300)
    return () => clearTimeout(t)
  }, [category, categorySlug, activeTab, city, search])

  const sorted = [...businesses].sort((a, b) => {
    if (sortBy === 'featured') {
      const o: Record<string, number> = { PRO: 0, STANDARD: 1, FREE: 2 }
      return (o[a.subscription] ?? 2) - (o[b.subscription] ?? 2)
    }
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
    if (sortBy === 'reviews') return b.reviewCount - a.reviewCount
    return 0
  })

  const dashboardHref = user?.user_metadata?.role === 'BUSINESS_OWNER' ? '/business/dashboard' : '/dashboard'

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#555', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    )
  }

  if (!category) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f5f0e8', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>🔍</div>
        <h1 style={{ fontWeight: '800' }}>Category not found</h1>
        <Link href="/browse" style={{ color: '#c9933a', textDecoration: 'none' }}>← Back to Browse</Link>
      </div>
    )
  }

  const tabs = [
    { slug: 'all', name: 'All' },
    ...category.subcategories.map(s => ({ slug: s.slug, name: s.name })),
  ]

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #1a1a1a', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/browse" style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>Browse All</Link>
          {user ? (
            <Link href={dashboardHref} style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>Login</Link>
              <Link href="/register/client" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none' }}>Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* CATEGORY HEADER */}
      <div style={{ borderBottom: '1px solid #1a1a1a', backgroundColor: '#0d0d0d' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 0' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#444', marginBottom: '1rem' }}>
            <Link href="/" style={{ color: '#555', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/browse" style={{ color: '#555', textDecoration: 'none' }}>Browse</Link>
            <span>›</span>
            <span style={{ color: '#c9933a' }}>{category.name}</span>
          </div>

          {/* Title row + filters */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {category.imageUrl ? (
                <div style={{ width: '52px', height: '52px', borderRadius: '0.75rem', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={category.imageUrl} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '52px', height: '52px', borderRadius: '0.75rem', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
                  {category.icon}
                </div>
              )}
              <div>
                <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)', fontWeight: '800', margin: '0 0 0.2rem', letterSpacing: '-0.3px' }}>{category.name}</h1>
                {category.description && <p style={{ color: '#555', fontSize: '0.82rem', margin: 0 }}>{category.description}</p>}
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ background: '#111', border: '1px solid #222', borderRadius: '0.65rem', padding: '0.55rem 0.875rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none', width: '180px' }}
                onFocus={e => e.currentTarget.style.borderColor = '#c9933a'}
                onBlur={e => e.currentTarget.style.borderColor = '#222'} />
              <select value={city} onChange={e => setCity(e.target.value)}
                style={{ background: '#111', border: '1px solid #222', borderRadius: '0.65rem', padding: '0.55rem 0.75rem', color: city === 'All Cities' ? '#666' : '#f5f0e8', fontSize: '0.85rem', outline: 'none' }}>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ background: '#111', border: '1px solid #222', borderRadius: '0.65rem', padding: '0.55rem 0.75rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none' }}>
                <option value="featured">Featured First</option>
                <option value="rating">Top Rated</option>
                <option value="reviews">Most Reviewed</option>
              </select>
            </div>
          </div>

          {/* Subcategory tabs */}
          <div style={{ display: 'flex', gap: '0', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.slug
              return (
                <button key={tab.slug} onClick={() => setActiveTab(tab.slug)}
                  style={{ background: 'none', border: 'none', borderBottom: isActive ? '2px solid #c9933a' : '2px solid transparent', color: isActive ? '#c9933a' : '#555', fontWeight: isActive ? '700' : '500', fontSize: '0.88rem', padding: '0.6rem 1.1rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease', fontFamily: 'system-ui, sans-serif' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#aaa' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#555' }}>
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* BUSINESS GRID */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

        {/* Results count */}
        <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {loadingBiz ? 'Loading...' : (
            <><span style={{ color: '#f5f0e8', fontWeight: '700' }}>{sorted.length}</span> businesses{activeTab !== 'all' && <> in <span style={{ color: '#c9933a' }}>{tabs.find(t => t.slug === activeTab)?.name}</span></>}{city !== 'All Cities' && <> · <span style={{ color: '#c9933a' }}>{city}</span></>}</>
          )}
        </p>

        {loadingBiz ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '1.25rem', overflow: 'hidden' }}>
                <div style={{ height: '160px', backgroundColor: '#1a1a1a' }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ height: '14px', backgroundColor: '#1a1a1a', borderRadius: '0.5rem', width: '70%' }} />
                  <div style={{ height: '12px', backgroundColor: '#1a1a1a', borderRadius: '0.5rem', width: '50%' }} />
                  <div style={{ height: '36px', backgroundColor: '#1a1a1a', borderRadius: '0.75rem' }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.5rem' }}>
              No businesses yet in{' '}
              <span style={{ color: '#c9933a' }}>
                {activeTab === 'all' ? category.name : tabs.find(t => t.slug === activeTab)?.name}
              </span>
            </h2>
            <p style={{ color: '#444', fontSize: '0.85rem', maxWidth: '340px', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
              Be the first to list your business here and reach the Habesha community across Canada.
            </p>
            <Link href="/register/business" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.75rem 1.75rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.88rem', textDecoration: 'none' }}>
              List Your Business →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {sorted.map((biz, i) => (
              <Link key={biz.id} href={`/business/${biz.slug}`} style={{ textDecoration: 'none', color: '#f5f0e8', animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}>
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1.25rem', overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9933a'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,147,58,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ height: '160px', position: 'relative', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
                    {biz.coverImage
                      ? <Image src={biz.coverImage} alt={biz.name} fill style={{ objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>{category.icon}</div>
                    }
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                      {biz.subscription === 'PRO' && <span style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: '800' }}>⭐ PRO</span>}
                      {biz.isVerified && <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: '700' }}>✓ Verified</span>}
                    </div>
                  </div>
                  <div style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h3 style={{ fontWeight: '700', fontSize: '0.9rem', margin: 0, flex: 1, paddingRight: '0.5rem' }}>{biz.name}</h3>
                      {biz.rating
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}><span style={{ color: '#f5c842', fontSize: '0.8rem' }}>★</span><span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{biz.rating}</span><span style={{ color: '#888', fontSize: '0.75rem' }}>({biz.reviewCount})</span></div>
                        : <span style={{ color: '#555', fontSize: '0.75rem' }}>New</span>
                      }
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: '#888', fontSize: '0.78rem' }}>{category.icon} {category.name}</span>
                      <span style={{ color: '#888', fontSize: '0.78rem' }}>📍 {biz.city}</span>
                    </div>
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: '#c9933a', borderRadius: '0.625rem', textAlign: 'center', fontWeight: '700', fontSize: '0.82rem', color: '#0a0a0a' }}>View Profile</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .biz-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  )
}

export default function CategoryPage() {
  return (
    <Suspense fallback={null}>
      <CategoryBrowseContent />
    </Suspense>
  )
}