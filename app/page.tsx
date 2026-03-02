'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const [categories, setCategories] = useState<{ name: string; slug: string; image: string }[]>([])

useEffect(() => {
  fetch('/api/admin/categories')
    .then(r => r.json())
    .then(data => {
      if (data.categories) {
        setCategories(data.categories.map((c: any) => ({
          name: c.name,
          slug: c.slug,
          image: c.imageUrl || `/categories/${c.slug}.jpg`,
        })))
      }
    })
    .catch(() => {})
}, [])

const cities = ['All Cities', 'Toronto', 'Calgary', 'Edmonton', 'Ottawa', 'Vancouver', 'Montreal']

function CategoryCard({ cat, i, hoveredCat, setHoveredCat }: {
  cat: { name: string; slug: string; image: string }
  i: number
  hoveredCat: string | null
  setHoveredCat: (slug: string | null) => void
}) {
  return (
    <Link
      href={`/browse?category=${cat.slug}`}
      style={{
        position: 'relative', borderRadius: '1rem', overflow: 'hidden',
        textDecoration: 'none', display: 'block', aspectRatio: '1 / 1',
        border: hoveredCat === cat.slug ? '2px solid #c9933a' : '2px solid transparent',
        transform: hoveredCat === cat.slug ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.3s ease',
        animation: `fadeInUp 0.5s ease ${i * 0.07}s both`,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHoveredCat(cat.slug)}
      onMouseLeave={() => setHoveredCat(null)}
    >
      <Image src={cat.image} alt={cat.name} fill style={{ objectFit: 'cover', transform: hoveredCat === cat.slug ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: hoveredCat === cat.slug ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)', transition: 'background 0.3s ease' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem', transform: hoveredCat === cat.slug ? 'translateY(0)' : 'translateY(4px)', transition: 'transform 0.3s ease' }}>
        <p style={{ color: '#fff', fontWeight: '700', fontSize: 'clamp(0.75rem, 2vw, 0.95rem)', margin: 0 }}>{cat.name}</p>
        <p style={{ color: '#c9933a', fontSize: '0.75rem', margin: '0.2rem 0 0', opacity: hoveredCat === cat.slug ? 1 : 0, transition: 'opacity 0.3s ease' }}>Browse →</p>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All Cities')
  const [hoveredCat, setHoveredCat] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main style={{ backgroundColor: '#0a0a0a', color: '#f5f0e8', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#c9933a', letterSpacing: '-0.5px' }}>Meda</div>

        {/* DESKTOP NAV */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/browse" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Browse</Link>
          <Link href="/login" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Login</Link>
          <Link href="/register/client" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b07d2a')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c9933a')}>Sign Up</Link>
          <Link href="/register/business" style={{ border: '1px solid #c9933a', color: '#c9933a', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#c9933a'; e.currentTarget.style.color = '#0a0a0a' }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#c9933a' }}>List Your Business</Link>
        </div>

        {/* HAMBURGER */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', flexDirection: 'column', gap: '5px' }}>
          <div style={{ width: '24px', height: '2px', backgroundColor: '#f5f0e8', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
          <div style={{ width: '24px', height: '2px', backgroundColor: '#f5f0e8', opacity: menuOpen ? 0 : 1, transition: 'all 0.3s' }} />
          <div style={{ width: '24px', height: '2px', backgroundColor: '#f5f0e8', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '65px', left: 0, right: 0, zIndex: 99, backgroundColor: '#111', borderBottom: '1px solid #222', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeInDown 0.2s ease' }}>
          <Link href="/browse" onClick={() => setMenuOpen(false)} style={{ color: '#f5f0e8', textDecoration: 'none', fontSize: '1rem', fontWeight: '600', padding: '0.5rem 0', borderBottom: '1px solid #222' }}>Browse</Link>
          <Link href="/login" onClick={() => setMenuOpen(false)} style={{ color: '#f5f0e8', textDecoration: 'none', fontSize: '1rem', fontWeight: '600', padding: '0.5rem 0', borderBottom: '1px solid #222' }}>Login</Link>
          <Link href="/register/client" onClick={() => setMenuOpen(false)} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', textDecoration: 'none', textAlign: 'center' }}>Sign Up</Link>
          <Link href="/register/business" onClick={() => setMenuOpen(false)} style={{ border: '1px solid #c9933a', color: '#c9933a', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', textDecoration: 'none', textAlign: 'center' }}>List Your Business</Link>
        </div>
      )}

      {/* HERO */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 4rem)', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: '#1a1a1a', border: '1px solid #333', borderRadius: '2rem', padding: '0.4rem 1rem', fontSize: '0.85rem', color: '#c9933a', marginBottom: '1.5rem', animation: 'fadeInDown 0.6s ease forwards' }}>
          🇨🇦 Habesha Community in Canada
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 7vw, 4rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.25rem', letterSpacing: '-1px', animation: 'fadeInUp 0.7s ease 0.1s both' }}>
          Find Habesha Businesses<br />
          <span style={{ color: '#c9933a' }}>Across Canada</span>
        </h1>
        <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', color: '#888', marginBottom: '2.5rem', lineHeight: '1.7', animation: 'fadeInUp 0.7s ease 0.2s both' }}>
          Book appointments, browse services, and connect with your community — all in one place.
        </p>

        {/* SEARCH BAR */}
        <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '700px', margin: '0 auto', flexDirection: 'column', animation: 'fadeInUp 0.7s ease 0.3s both' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search businesses, services..."
              style={{ flex: 1, minWidth: '160px', background: '#111', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', color: '#f5f0e8', fontSize: '0.95rem', outline: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
              onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
            <select value={city} onChange={e => setCity(e.target.value)}
              style={{ background: '#111', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#888', fontSize: '0.95rem', outline: 'none', minWidth: '130px' }}>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Link href={`/browse?search=${search}&city=${city}`} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.875rem 2rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none', textAlign: 'center', display: 'block' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b07d2a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c9933a')}>
            Search
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '1rem 1.5rem clamp(3rem, 8vw, 6rem)', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: '700', textAlign: 'center', marginBottom: '1.5rem' }}>Browse by Category</h2>
        <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {categories.map((cat, i) => (
            <CategoryCard key={cat.slug} cat={cat} i={i} hoveredCat={hoveredCat} setHoveredCat={setHoveredCat} />
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ borderTop: '1px solid #222', borderBottom: '1px solid #222', padding: 'clamp(2rem, 5vw, 3rem) 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem 2rem', textAlign: 'center' }} className="stats-grid">
          {[
            { number: 'Verified', label: 'Business Listings' },
            { number: '9', label: 'Business Categories' },
            { number: '6', label: 'Cities Expanding Soon' },
            { number: 'Join Us', label: 'Be Among the First' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: '800', color: '#c9933a' }}>{stat.number}</div>
              <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '2rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#555' }}>
        © 2025 Meda. Built for the Habesha community in Canada.
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }

        /* Desktop: 5+4 layout */
        @media (min-width: 769px) {
          .cat-grid {
            grid-template-columns: repeat(5, 1fr) !important;
          }
          .cat-grid > a:nth-child(n+6) {
            /* handled by auto-fill */
          }
          .stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }

        /* Tablet */
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .cat-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  )
}