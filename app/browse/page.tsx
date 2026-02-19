'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const categories = [
  { label: 'All', value: '' },
  { label: 'Hair Styling', value: 'hair-styling' },
  { label: 'Makeup', value: 'makeup' },
  { label: 'Barber', value: 'barber' },
  { label: 'Catering', value: 'catering' },
  { label: 'Cameraman', value: 'cameraman' },
  { label: 'Event Decoration', value: 'event-decoration' },
  { label: 'Car Sales', value: 'car-sales' },
  { label: 'Baker', value: 'baker' },
  { label: 'Handy Services', value: 'handy-services' },
]

const cities = ['All Cities', 'Toronto', 'Calgary', 'Edmonton', 'Ottawa', 'Vancouver', 'Montreal']

const sampleBusinesses = [
  { id: 1, name: 'Selam Hair Studio', category: 'Hair Styling', city: 'Toronto', rating: 4.8, reviews: 24, image: '/categories/hair-styling.jpg', slug: 'selam-hair-studio', subscription: 'PRO', verified: true, price: '$$' },
  { id: 2, name: 'Meron Makeup', category: 'Makeup', city: 'Calgary', rating: 4.9, reviews: 18, image: '/categories/makeup.jpg', slug: 'meron-makeup', subscription: 'STANDARD', verified: true, price: '$$$' },
  { id: 3, name: 'Habesha Cuts', category: 'Barber', city: 'Edmonton', rating: 4.7, reviews: 41, image: '/categories/barber.jpg', slug: 'habesha-cuts', subscription: 'PRO', verified: true, price: '$' },
  { id: 4, name: 'Injera Catering Co.', category: 'Catering', city: 'Toronto', rating: 4.6, reviews: 12, image: '/categories/catering.jpg', slug: 'injera-catering', subscription: 'STANDARD', verified: false, price: '$$$' },
  { id: 5, name: 'Lens by Dawit', category: 'Cameraman', city: 'Ottawa', rating: 5.0, reviews: 8, image: '/categories/cameraman.jpg', slug: 'lens-by-dawit', subscription: 'PRO', verified: true, price: '$$$' },
  { id: 6, name: 'Habesha Decor', category: 'Event Decoration', city: 'Vancouver', rating: 4.5, reviews: 15, image: '/categories/event-decoration.jpg', slug: 'habesha-decor', subscription: 'FREE', verified: false, price: '$$' },
  { id: 7, name: 'Ethio Auto Sales', category: 'Car Sales', city: 'Toronto', rating: 4.3, reviews: 9, image: '/categories/car-sales.jpg', slug: 'ethio-auto', subscription: 'STANDARD', verified: false, price: '$$$$' },
  { id: 8, name: 'Hana Bakery', category: 'Baker', city: 'Calgary', rating: 4.9, reviews: 33, image: '/categories/baker.jpg', slug: 'hana-bakery', subscription: 'PRO', verified: true, price: '$' },
  { id: 9, name: 'Fix It Fast', category: 'Handy Services', city: 'Edmonton', rating: 4.4, reviews: 7, image: '/categories/handy-services.jpg', slug: 'fix-it-fast', subscription: 'FREE', verified: false, price: '$$' },
]

type ViewMode = 'grid' | 'map'

export default function BrowsePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('All Cities')
  const [view, setView] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState('featured')

  const filtered = sampleBusinesses
    .filter(b => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !category || b.category.toLowerCase().replace(' ', '-') === category
      const matchCity = city === 'All Cities' || b.city === city
      return matchSearch && matchCategory && matchCity
    })
    .sort((a, b) => {
      if (sortBy === 'featured') {
        const order = { PRO: 0, STANDARD: 1, FREE: 2 }
        return order[a.subscription as keyof typeof order] - order[b.subscription as keyof typeof order]
      }
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'reviews') return b.reviews - a.reviews
      return 0
    })

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>

      {/* NAVBAR */}
      <nav style={{
        borderBottom: '1px solid #222', padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>Login</Link>
          <Link href="/register/client" style={{
            backgroundColor: '#c9933a', color: '#0a0a0a',
            padding: '0.5rem 1.25rem', borderRadius: '0.75rem',
            fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none',
          }}>Sign Up</Link>
        </div>
      </nav>

      {/* SEARCH HEADER */}
      <div style={{ backgroundColor: '#111', borderBottom: '1px solid #222', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            Browse Habesha Businesses
          </h1>
          {/* FILTERS ROW */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* SEARCH */}
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search businesses..."
              style={{
                flex: 1, minWidth: '200px',
                background: '#0a0a0a', border: '1px solid #333',
                borderRadius: '0.75rem', padding: '0.75rem 1rem',
                color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
              onBlur={e => (e.currentTarget.style.borderColor = '#333')}
            />
            {/* CATEGORY */}
            <select value={category} onChange={e => setCategory(e.target.value)} style={{
              background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem',
              padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
            }}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {/* CITY */}
            <select value={city} onChange={e => setCity(e.target.value)} style={{
              background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem',
              padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
            }}>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
            {/* SORT */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem',
              padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
            }}>
              <option value="featured">Featured First</option>
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Reviewed</option>
            </select>
            {/* VIEW TOGGLE */}
            <div style={{ display: 'flex', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', overflow: 'hidden' }}>
              <button onClick={() => setView('grid')} style={{
                padding: '0.75rem 1rem', border: 'none', cursor: 'pointer',
                backgroundColor: view === 'grid' ? '#c9933a' : 'transparent',
                color: view === 'grid' ? '#0a0a0a' : '#888',
                fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
              }}>⊞ Grid</button>
              <button onClick={() => setView('map')} style={{
                padding: '0.75rem 1rem', border: 'none', cursor: 'pointer',
                backgroundColor: view === 'map' ? '#c9933a' : 'transparent',
                color: view === 'map' ? '#0a0a0a' : '#888',
                fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
              }}>🗺 Map</button>
            </div>
          </div>

          {/* CATEGORY PILLS */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {categories.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)} style={{
                padding: '0.4rem 1rem', borderRadius: '2rem', border: '1px solid #333',
                backgroundColor: category === c.value ? '#c9933a' : 'transparent',
                color: category === c.value ? '#0a0a0a' : '#888',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
              }}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

        {/* RESULTS COUNT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            <span style={{ color: '#f5f0e8', fontWeight: '700' }}>{filtered.length}</span> businesses found
            {city !== 'All Cities' && <span> in <span style={{ color: '#c9933a' }}>{city}</span></span>}
          </p>
        </div>

        {/* GRID VIEW */}
        {view === 'grid' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No businesses found</h3>
                <p style={{ color: '#888' }}>Try adjusting your search or filters</p>
              </div>
            ) : filtered.map((business, i) => (
              <Link key={business.id} href={`/business/${business.slug}`} style={{
                textDecoration: 'none', color: '#f5f0e8',
                animation: `fadeInUp 0.4s ease ${i * 0.05}s both`,
              }}>
                <div style={{
                  backgroundColor: '#111', border: '1px solid #222',
                  borderRadius: '1.25rem', overflow: 'hidden',
                  transition: 'all 0.3s', cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = '#c9933a'
                    el.style.transform = 'translateY(-4px)'
                    el.style.boxShadow = '0 8px 32px rgba(201,147,58,0.15)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = '#222'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}>
                  {/* IMAGE */}
                  <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                    <Image src={business.image} alt={business.name} fill
                      style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                    {/* BADGES */}
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                      {business.subscription === 'PRO' && (
                        <span style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '800' }}>⭐ PRO</span>
                      )}
                      {business.verified && (
                        <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>✓ Verified</span>
                      )}
                    </div>
                    {/* PRICE */}
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                      <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#f5f0e8', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700' }}>{business.price}</span>
                    </div>
                  </div>
                  {/* INFO */}
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontWeight: '700', fontSize: '1rem', margin: 0, lineHeight: '1.3' }}>{business.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                        <span style={{ color: '#f5c842', fontSize: '0.85rem' }}>★</span>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{business.rating}</span>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>({business.reviews})</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>✂️ {business.category}</span>
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>📍 {business.city}</span>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', backgroundColor: '#c9933a', borderRadius: '0.75rem', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: '#0a0a0a' }}>
                      View Profile
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* MAP VIEW */}
        {view === 'map' && (
          <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
            <div style={{
              backgroundColor: '#111', border: '1px solid #333',
              borderRadius: '1.25rem', overflow: 'hidden',
              height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* MAP PLACEHOLDER — Google Maps integration coming next */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, #111 0px, #111 39px, #1a1a1a 39px, #1a1a1a 40px), repeating-linear-gradient(90deg, #111 0px, #111 39px, #1a1a1a 39px, #1a1a1a 40px)',
              }} />
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Map View</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Google Maps integration coming soon</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: '500px' }}>
                  {filtered.map(b => (
                    <Link key={b.id} href={`/business/${b.slug}`} style={{
                      backgroundColor: b.subscription === 'PRO' ? '#c9933a' : '#222',
                      color: b.subscription === 'PRO' ? '#0a0a0a' : '#f5f0e8',
                      padding: '0.4rem 0.75rem', borderRadius: '1rem',
                      fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none',
                      border: '1px solid #333',
                    }}>
                      📍 {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* BUSINESS LIST BELOW MAP */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map(business => (
                <Link key={business.id} href={`/business/${business.slug}`} style={{ textDecoration: 'none', color: '#f5f0e8' }}>
                  <div style={{
                    backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem',
                    padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '0.75rem', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <Image src={business.image} alt={business.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{business.name}</span>
                        {business.subscription === 'PRO' && <span style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: '800' }}>PRO</span>}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.85rem' }}>{business.category} · {business.city}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: '#f5c842' }}>★</span>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{business.rating}</span>
                      </div>
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>({business.reviews})</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          div[style*="minmax(280px"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          div[style*="minmax(280px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}