'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const categories = [
  { name: 'Hair Styling', slug: 'hair-styling', image: '/categories/hair-styling.jpg' },
  { name: 'Makeup', slug: 'makeup', image: '/categories/makeup.jpg' },
  { name: 'Barber', slug: 'barber', image: '/categories/barber.jpg' },
  { name: 'Catering', slug: 'catering', image: '/categories/catering.jpg' },
  { name: 'Cameraman', slug: 'cameraman', image: '/categories/cameraman.jpg' },
  { name: 'Event Decoration', slug: 'event-decoration', image: '/categories/event-decoration.jpg' },
  { name: 'Car Sales', slug: 'car-sales', image: '/categories/car-sales.jpg' },
  { name: 'Baker', slug: 'baker', image: '/categories/baker.jpg' },
  { name: 'Handy Services', slug: 'handy-services', image: '/categories/handy-services.jpg' },
]

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
        position: 'relative',
        borderRadius: '1rem',
        overflow: 'hidden',
        textDecoration: 'none',
        display: 'block',
        aspectRatio: '1 / 1',
        border: hoveredCat === cat.slug ? '2px solid #c9933a' : '2px solid transparent',
        transform: hoveredCat === cat.slug ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.3s ease',
        animation: `fadeInUp 0.5s ease ${i * 0.07}s both`,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHoveredCat(cat.slug)}
      onMouseLeave={() => setHoveredCat(null)}
    >
      <Image
        src={cat.image}
        alt={cat.name}
        fill
        style={{
          objectFit: 'cover',
          transform: hoveredCat === cat.slug ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.4s ease',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: hoveredCat === cat.slug
          ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)'
          : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        transition: 'background 0.3s ease',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '1rem',
        transform: hoveredCat === cat.slug ? 'translateY(0)' : 'translateY(4px)',
        transition: 'transform 0.3s ease',
      }}>
        <p style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', margin: 0 }}>
          {cat.name}
        </p>
        <p style={{
          color: '#c9933a', fontSize: '0.8rem', margin: '0.2rem 0 0',
          opacity: hoveredCat === cat.slug ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          Browse →
        </p>
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
      <nav style={{
        borderBottom: '1px solid #222',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#c9933a', letterSpacing: '-0.5px' }}>
          Meda
        </div>

        {/* DESKTOP NAV */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/browse" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
            Browse
          </Link>
          <Link href="/login" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
            Login
          </Link>
          <Link href="/register/client" style={{
            backgroundColor: '#c9933a', color: '#0a0a0a',
            padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
            fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b07d2a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c9933a')}>
            Sign Up
          </Link>
          <Link href="/register/business" style={{
            border: '1px solid #c9933a', color: '#c9933a',
            padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
            fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#c9933a'; e.currentTarget.style.color = '#0a0a0a' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#c9933a' }}>
            List Your Business
          </Link>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
          <div style={{ width: '24px', height: '2px', backgroundColor: '#f5f0e8', marginBottom: '5px', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
          <div style={{ width: '24px', height: '2px', backgroundColor: '#f5f0e8', marginBottom: '5px', opacity: menuOpen ? 0 : 1, transition: 'all 0.3s' }} />
          <div style={{ width: '24px', height: '2px', backgroundColor: '#f5f0e8', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
        </button>
      </nav>

      {/* MOBILE MENU DROPDOWN */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '65px', left: 0, right: 0, zIndex: 99,
          backgroundColor: '#111', borderBottom: '1px solid #222',
          padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem',
          animation: 'fadeInDown 0.2s ease',
        }}>
          <Link href="/browse" onClick={() => setMenuOpen(false)} style={{ color: '#f5f0e8', textDecoration: 'none', fontSize: '1rem', fontWeight: '600' }}>Browse</Link>
          <Link href="/login" onClick={() => setMenuOpen(false)} style={{ color: '#f5f0e8', textDecoration: 'none', fontSize: '1rem', fontWeight: '600' }}>Login</Link>
          <Link href="/register/client" onClick={() => setMenuOpen(false)} style={{
            backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem', fontWeight: '700', textDecoration: 'none', textAlign: 'center',
          }}>Sign Up</Link>
          <Link href="/register/business" onClick={() => setMenuOpen(false)} style={{
            border: '1px solid #c9933a', color: '#c9933a', padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem', fontWeight: '700', textDecoration: 'none', textAlign: 'center',
          }}>List Your Business</Link>
        </div>
      )}

      {/* HERO */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: '#1a1a1a', border: '1px solid #333',
          borderRadius: '2rem', padding: '0.4rem 1rem', fontSize: '0.85rem',
          color: '#c9933a', marginBottom: '2rem',
          animation: 'fadeInDown 0.6s ease forwards',
        }}>
          🇨🇦 Habesha Community in Canada
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: '800', lineHeight: '1.1',
          marginBottom: '1.5rem', letterSpacing: '-1px',
          animation: 'fadeInUp 0.7s ease 0.1s both',
        }}>
          Find Habesha Businesses<br />
          <span style={{ color: '#c9933a' }}>Across Canada</span>
        </h1>

        <p style={{
          fontSize: '1.15rem', color: '#888', marginBottom: '3rem', lineHeight: '1.7',
          animation: 'fadeInUp 0.7s ease 0.2s both',
        }}>
          Book appointments, browse services, and connect with your community — all in one place.
        </p>

        {/* SEARCH BAR */}
        <div style={{
          display: 'flex', gap: '0.75rem', maxWidth: '700px', margin: '0 auto',
          flexWrap: 'wrap', animation: 'fadeInUp 0.7s ease 0.3s both',
        }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search businesses, services..."
            style={{
              flex: 1, minWidth: '200px',
              background: '#111', border: '1px solid #333',
              borderRadius: '0.75rem', padding: '1rem 1.25rem',
              color: '#f5f0e8', fontSize: '0.95rem', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
            onBlur={e => (e.currentTarget.style.borderColor = '#333')}
          />
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            style={{
              background: '#111', border: '1px solid #333',
              borderRadius: '0.75rem', padding: '1rem',
              color: '#888', fontSize: '0.95rem', outline: 'none',
            }}>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
          <button style={{
            backgroundColor: '#c9933a', color: '#0a0a0a',
            padding: '1rem 2rem', borderRadius: '0.75rem',
            fontWeight: '700', fontSize: '0.95rem', border: 'none',
            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b07d2a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c9933a')}>
            Search
          </button>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '2rem 2rem 6rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center', marginBottom: '2.5rem' }}>
          Browse by Category
        </h2>
        {/* Row 1 — 5 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          {categories.slice(0, 5).map((cat, i) => (
            <CategoryCard key={cat.slug} cat={cat} i={i} hoveredCat={hoveredCat} setHoveredCat={setHoveredCat} />
          ))}
        </div>
        {/* Row 2 — 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {categories.slice(5).map((cat, i) => (
            <CategoryCard key={cat.slug} cat={cat} i={i + 5} hoveredCat={hoveredCat} setHoveredCat={setHoveredCat} />
          ))}
        </div>
      </section>

      {/* STATS STRIP */}
      <section style={{ borderTop: '1px solid #222', borderBottom: '1px solid #222', padding: '3rem 2rem' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-around',
          flexWrap: 'wrap', gap: '2rem', textAlign: 'center',
        }}>
          {[
            { number: '200+', label: 'Businesses Listed' },
            { number: '9', label: 'Categories' },
            { number: '6', label: 'Cities in Canada' },
            { number: '1000+', label: 'Happy Clients' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#c9933a' }}>{stat.number}</div>
              <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#555' }}>
        © 2025 Meda. Built for the Habesha community in Canada.
      </footer>

      {/* GLOBAL STYLES */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (max-width: 600px) {
          section > div[style*="repeat(5"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section > div[style*="repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

    </main>
  )
}