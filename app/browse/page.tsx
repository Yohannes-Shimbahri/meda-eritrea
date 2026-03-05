'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const cities = ['All Cities', 'Toronto', 'Calgary', 'Edmonton', 'Ottawa', 'Vancouver', 'Montreal']

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Toronto: { lat: 43.6532, lng: -79.3832 },
  Calgary: { lat: 51.0447, lng: -114.0719 },
  Edmonton: { lat: 53.5461, lng: -113.4938 },
  Ottawa: { lat: 45.4215, lng: -75.6972 },
  Vancouver: { lat: 49.2827, lng: -123.1207 },
  Montreal: { lat: 45.5017, lng: -73.5673 },
  'All Cities': { lat: 56.1304, lng: -106.3468 },
}

const sampleBusinesses = [
  { id: 1, name: 'Selam Hair Studio', category: 'Hair Styling', city: 'Toronto', rating: 4.8, reviewCount: 24, coverImage: '/categories/hair-styling.jpg', slug: 'selam-hair-studio', subscription: 'PRO', isVerified: true },
  { id: 2, name: 'Meron Makeup', category: 'Makeup', city: 'Calgary', rating: 4.9, reviewCount: 18, coverImage: '/categories/makeup.jpg', slug: 'meron-makeup', subscription: 'STANDARD', isVerified: true },
  { id: 3, name: 'Habesha Cuts', category: 'Barber', city: 'Edmonton', rating: 4.7, reviewCount: 41, coverImage: '/categories/barber.jpg', slug: 'habesha-cuts', subscription: 'PRO', isVerified: true },
  { id: 4, name: 'Injera Catering Co.', category: 'Catering', city: 'Toronto', rating: 4.6, reviewCount: 12, coverImage: '/categories/catering.jpg', slug: 'injera-catering', subscription: 'STANDARD', isVerified: false },
  { id: 5, name: 'Lens by Dawit', category: 'Cameraman', city: 'Ottawa', rating: 5.0, reviewCount: 8, coverImage: '/categories/cameraman.jpg', slug: 'lens-by-dawit', subscription: 'PRO', isVerified: true },
  { id: 6, name: 'Habesha Decor', category: 'Event Decoration', city: 'Vancouver', rating: 4.5, reviewCount: 15, coverImage: '/categories/event-decoration.jpg', slug: 'habesha-decor', subscription: 'FREE', isVerified: false },
  { id: 7, name: 'Ethio Auto Sales', category: 'Car Sales', city: 'Toronto', rating: 4.3, reviewCount: 9, coverImage: '/categories/car-sales.jpg', slug: 'ethio-auto', subscription: 'STANDARD', isVerified: false },
  { id: 8, name: 'Hana Bakery', category: 'Baker', city: 'Calgary', rating: 4.9, reviewCount: 33, coverImage: '/categories/baker.jpg', slug: 'hana-bakery', subscription: 'PRO', isVerified: true },
  { id: 9, name: 'Fix It Fast', category: 'Handy Services', city: 'Edmonton', rating: 4.4, reviewCount: 7, coverImage: '/categories/handy-services.jpg', slug: 'fix-it-fast', subscription: 'FREE', isVerified: false },
]

type Business = {
  id: string | number
  name: string
  slug: string
  category: string | { id: string; name: string; slug: string; icon: string } | null
  city: string
  subscription: string
  isVerified: boolean
  coverImage: string | null
  rating: number | null
  reviewCount: number
}

function getCatName(category: any): string {
  if (!category) return ''
  if (typeof category === 'object') return category.name || ''
  return String(category)
}

function getCategoryEmoji(category: any) {
  const name = getCatName(category)
  const map: Record<string, string> = {
    HAIR_STYLING: '✂️', 'Hair Styling': '✂️', BARBER: '💈', Barber: '💈',
    MAKEUP: '💄', Makeup: '💄', CATERING: '🍽️', Catering: '🍽️',
    CAMERAMAN: '📸', Cameraman: '📸', BAKER: '🍞', Baker: '🍞',
    CAR_SALES: '🚗', 'Car Sales': '🚗', EVENT_DECORATION: '🎊', 'Event Decoration': '🎊',
    HANDY_SERVICES: '🔧', 'Handy Services': '🔧',
  }
  return map[name] || '🏪'
}

function jitterCoords(lat: number, lng: number, index: number) {
  const angle = (index * 137.5) % 360
  const r = 0.015 * Math.sqrt((index % 5) / 5 + 0.2)
  return { lat: lat + r * Math.cos(angle * Math.PI / 180), lng: lng + r * Math.sin(angle * Math.PI / 180) }
}

declare global { interface Window { google: any; initGoogleMap: () => void } }

function GoogleMap({ businesses, selectedId, onSelect, city }: { businesses: Business[]; selectedId: string | number | null; onSelect: (id: string | number) => void; city: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const initializedRef = useRef(false)

  const buildMap = useCallback(() => {
    if (!mapRef.current || !window.google || initializedRef.current) return
    initializedRef.current = true
    const centerCity = city !== 'All Cities' ? city : 'Toronto'
    const center = CITY_COORDS[centerCity] || CITY_COORDS.Toronto
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center, zoom: city !== 'All Cities' ? 12 : 4,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111111' }] },
      ],
    })
    infoWindowRef.current = new window.google.maps.InfoWindow()
  }, [city])

  const placeMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google) return
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    businesses.forEach((biz, i) => {
      const cityCoords = CITY_COORDS[biz.city]
      if (!cityCoords) return
      const { lat, lng } = jitterCoords(cityCoords.lat, cityCoords.lng, i)
      const isSelected = biz.id === selectedId
      const isPro = biz.subscription === 'PRO'
      const marker = new window.google.maps.Marker({
        position: { lat, lng }, map: mapInstanceRef.current, title: biz.name,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: isSelected ? 14 : isPro ? 11 : 9, fillColor: isSelected ? '#ffffff' : isPro ? '#c9933a' : '#555555', fillOpacity: 1, strokeColor: isSelected ? '#c9933a' : '#0a0a0a', strokeWeight: isSelected ? 3 : 2 },
        zIndex: isSelected ? 1000 : isPro ? 10 : 1,
      })
      marker.addListener('click', () => {
        onSelect(biz.id)
        infoWindowRef.current.setContent(`<div style="background:#111;color:#f5f0e8;padding:12px 16px;border-radius:10px;min-width:180px;font-family:sans-serif;border:1px solid #333;"><div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;">${biz.name}</div><div style="color:#888;font-size:0.8rem;margin-bottom:4px;">${getCatName(biz.category).replace(/_/g,' ')} · ${biz.city}</div>${biz.rating ? `<div style="color:#f5c842;font-size:0.8rem;">★ ${biz.rating} (${biz.reviewCount})</div>` : '<div style="color:#555;font-size:0.8rem;">New listing</div>'}<a href="/business/${biz.slug}" style="display:block;margin-top:8px;background:#c9933a;color:#0a0a0a;padding:5px 10px;border-radius:6px;text-align:center;font-weight:700;font-size:0.8rem;text-decoration:none;">View Profile →</a></div>`)
        infoWindowRef.current.open(mapInstanceRef.current, marker)
      })
      markersRef.current.push(marker)
    })
  }, [businesses, selectedId, onSelect])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    if (window.google?.maps) { buildMap(); return }
    if (!document.getElementById('gmaps-script')) {
      window.initGoogleMap = () => { buildMap() }
      const s = document.createElement('script')
      s.id = 'gmaps-script'
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`
      s.async = true; s.defer = true
      document.head.appendChild(s)
    } else {
      const check = setInterval(() => { if (window.google?.maps) { clearInterval(check); buildMap() } }, 100)
    }
  }, [buildMap])

  useEffect(() => { if (mapInstanceRef.current) placeMarkers() }, [placeMarkers])
  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return
    const biz = businesses.find(b => b.id === selectedId)
    if (!biz) return
    const coords = CITY_COORDS[biz.city]
    if (coords) { mapInstanceRef.current.panTo(coords); mapInstanceRef.current.setZoom(13) }
  }, [selectedId, businesses])
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const key = city !== 'All Cities' ? city : 'Toronto'
    mapInstanceRef.current.panTo(CITY_COORDS[key] || CITY_COORDS.Toronto)
    mapInstanceRef.current.setZoom(city !== 'All Cities' ? 12 : 4)
  }, [city])

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      mapInstanceRef.current.panTo(loc); mapInstanceRef.current.setZoom(14)
      new window.google.maps.Marker({ position: loc, map: mapInstanceRef.current, title: 'You', icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#60a5fa', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 }, zIndex: 9999 })
    })
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}><div style={{ fontSize: '2rem' }}>🗺️</div><p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', padding: '0 2rem' }}>Add <code style={{ color: '#c9933a' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local</p></div>
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <button onClick={goToMyLocation} style={{ position: 'absolute', bottom: '5rem', right: '0.75rem', zIndex: 10, backgroundColor: '#0a0a0a', border: '1px solid #444', borderRadius: '0.75rem', padding: '0.6rem 1rem', color: '#f5f0e8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>📍 My Location</button>
      <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10, backgroundColor: 'rgba(10,10,10,0.88)', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#888', backdropFilter: 'blur(8px)' }}>
        <span style={{ color: '#c9933a', fontWeight: '700' }}>{businesses.length}</span> businesses
      </div>
    </div>
  )
}

function BrowseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const changeCategory = (val: string) => {
    setCategory(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set('category', val)
    else params.delete('category')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const [city, setCity] = useState('All Cities')
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [sortBy, setSortBy] = useState('featured')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([{ label: 'All', value: '' }])
  const [loadingData, setLoadingData] = useState(false)
  const [usingRealData, setUsingRealData] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const cardRefs = useRef<Record<string | number, HTMLDivElement | null>>({})

  useEffect(() => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.categories?.length) {
          setCategories([
            { label: 'All', value: '' },
            ...data.categories.map((c: any) => ({ label: c.name, value: c.slug }))
          ])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) setCategory(cat)
  }, [searchParams])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session?.user) setUser(session.user) })
  }, [])

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoadingData(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (category) params.set('category', category)
        if (city !== 'All Cities') params.set('city', city)
        const res = await fetch(`/api/businesses?${params}`)
        const data = await res.json()
        if (data.businesses && data.businesses.length > 0) { setBusinesses(data.businesses); setUsingRealData(true) }
        else if (data.businesses && data.businesses.length === 0 && usingRealData) setBusinesses([])
      } catch { } finally { setLoadingData(false) }
    }
    const t = setTimeout(fetchBusinesses, 300)
    return () => clearTimeout(t)
  }, [search, category, city])

  const filtered = businesses
    .filter(b => {
      if (usingRealData) return true
      return (
        (b.name.toLowerCase().includes(search.toLowerCase()) || getCatName(b.category).toLowerCase().includes(search.toLowerCase())) &&
        (!category || getCatName(b.category).toLowerCase().replace(/\s+/g, '-') === category) &&
        (city === 'All Cities' || b.city === city)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'featured') { const o = { PRO: 0, STANDARD: 1, FREE: 2 }; return (o[a.subscription as keyof typeof o] ?? 2) - (o[b.subscription as keyof typeof o] ?? 2) }
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount
      return 0
    })

  const handleSelect = useCallback((id: string | number) => {
    setSelectedId(id)
    const card = cardRefs.current[id]
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const dashboardHref = user?.user_metadata?.role === 'BUSINESS_OWNER' ? '/business/dashboard' : '/dashboard'

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #222', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {user ? (
            <>
              <Link href={dashboardHref} className="hide-mobile" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>My Dashboard</Link>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} className="hide-mobile" style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>Sign Out</button>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#c9933a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: '#0a0a0a', flexShrink: 0 }}>
                {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hide-mobile" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>Login</Link>
              <Link href="/register/client" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* SEARCH HEADER */}
      <div style={{ backgroundColor: '#111', borderBottom: '1px solid #222', padding: '1rem' }}>
        <h1 style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', fontWeight: '800', marginBottom: '0.75rem' }}>Browse Habesha Businesses</h1>

        {/* Search + view toggle row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search businesses..."
            style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.7rem 0.875rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', minWidth: 0 }}
            onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
            onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="mobile-filter-btn" style={{ display: 'none', backgroundColor: filtersOpen ? '#c9933a' : '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.7rem 0.875rem', color: filtersOpen ? '#0a0a0a' : '#888', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            ⚙ Filter
          </button>
          <div style={{ display: 'flex', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', overflow: 'hidden', flexShrink: 0 }}>
            <button onClick={() => setView('grid')} style={{ padding: '0.7rem 0.875rem', border: 'none', cursor: 'pointer', backgroundColor: view === 'grid' ? '#c9933a' : 'transparent', color: view === 'grid' ? '#0a0a0a' : '#888', fontWeight: '600', fontSize: '0.85rem' }}>⊞</button>
            <button onClick={() => setView('map')} style={{ padding: '0.7rem 0.875rem', border: 'none', cursor: 'pointer', backgroundColor: view === 'map' ? '#c9933a' : 'transparent', color: view === 'map' ? '#0a0a0a' : '#888', fontWeight: '600', fontSize: '0.85rem' }}>🗺</button>
          </div>
        </div>

        {/* Desktop filters */}
        <div className="desktop-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <select value={category} onChange={e => changeCategory(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.65rem 1rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none' }}>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={city} onChange={e => setCity(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.65rem 1rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none' }}>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.65rem 1rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none' }}>
            <option value="featured">Featured First</option>
            <option value="rating">Top Rated</option>
            <option value="reviews">Most Reviewed</option>
          </select>
        </div>

        {/* Mobile filters drawer */}
        {filtersOpen && (
          <div className="mobile-filters" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#0a0a0a', borderRadius: '0.75rem', border: '1px solid #222' }}>
            <select value={category} onChange={e => changeCategory(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none' }}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={city} onChange={e => setCity(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none' }}>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#111', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', color: '#f5f0e8', fontSize: '0.85rem', outline: 'none', gridColumn: '1/-1' }}>
              <option value="featured">Featured First</option>
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Reviewed</option>
            </select>
          </div>
        )}

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {categories.map(c => (
            <button key={c.value} onClick={() => changeCategory(c.value)} style={{ padding: '0.3rem 0.75rem', borderRadius: '2rem', border: '1px solid #333', backgroundColor: category === c.value ? '#c9933a' : 'transparent', color: category === c.value ? '#0a0a0a' : '#888', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>
          {loadingData ? 'Searching...' : <><span style={{ color: '#f5f0e8', fontWeight: '700' }}>{filtered.length}</span> businesses found{city !== 'All Cities' && <> in <span style={{ color: '#c9933a' }}>{city}</span></>}{category && <> · <span style={{ color: '#c9933a' }}>{categories.find(c => c.value === category)?.label}</span></>}{!usingRealData && <span style={{ color: '#555' }}> · sample</span>}</>}
        </p>
        {category && <button onClick={() => changeCategory('')} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.3rem 0.65rem', borderRadius: '1rem', cursor: 'pointer', fontSize: '0.78rem' }}>✕ Clear</button>}
      </div>

      {/* GRID VIEW */}
      {view === 'grid' && (
        <div style={{ padding: '0 1rem 3rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div className="biz-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {loadingData ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1.25rem', overflow: 'hidden' }}>
                  <div style={{ height: '160px', backgroundColor: '#1a1a1a' }} />
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ height: '14px', backgroundColor: '#1a1a1a', borderRadius: '0.5rem', width: '70%' }} />
                    <div style={{ height: '12px', backgroundColor: '#1a1a1a', borderRadius: '0.5rem', width: '50%' }} />
                    <div style={{ height: '36px', backgroundColor: '#1a1a1a', borderRadius: '0.75rem' }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No businesses found</h3>
                <p style={{ color: '#888' }}>Try adjusting your search or filters</p>
              </div>
            ) : filtered.map((business, i) => (
              <Link key={business.id} href={`/business/${business.slug}`} style={{ textDecoration: 'none', color: '#f5f0e8', animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}>
                <div className='biz-card' style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1.25rem', overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9933a'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,147,58,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ height: 'clamp(95px, 18vw, 160px)', position: 'relative', overflow: 'hidden', backgroundColor: '#222' }}>
                    {business.coverImage ? <Image src={business.coverImage} alt={business.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>{getCategoryEmoji(business.category)}</div>}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                      {business.subscription === 'PRO' && <span style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: '800' }}>⭐ PRO</span>}
                      {business.isVerified && <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: '700' }}>✓ Verified</span>}
                    </div>
                  </div>
                  <div style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h3 style={{ fontWeight: '700', fontSize: '0.9rem', margin: 0, flex: 1, paddingRight: '0.5rem' }}>{business.name}</h3>
                      {business.rating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                          <span style={{ color: '#f5c842', fontSize: '0.8rem' }}>★</span>
                          <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{business.rating}</span>
                          <span style={{ color: '#888', fontSize: '0.75rem' }}>({business.reviewCount})</span>
                        </div>
                      ) : <span style={{ color: '#555', fontSize: '0.75rem', flexShrink: 0 }}>New</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: '#888', fontSize: '0.78rem' }}>{getCategoryEmoji(typeof business.category === 'object' ? business.category?.name : business.category)} {(typeof business.category === 'object' ? business.category?.name : business.category)?.replace(/_/g, ' ') ?? ''}</span>
                      <span style={{ color: '#888', fontSize: '0.78rem' }}>📍 {business.city}</span>
                    </div>
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: '#c9933a', borderRadius: '0.625rem', textAlign: 'center', fontWeight: '700', fontSize: '0.82rem', color: '#0a0a0a' }}>View Profile</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* MAP VIEW */}
      {view === 'map' && (
        <div className="map-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          <div className="map-list" style={{ width: '320px', flexShrink: 0, overflowY: 'auto', borderRight: '1px solid #222', backgroundColor: '#080808' }}>
            <div style={{ padding: '0.75rem' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}><div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div><p style={{ fontSize: '0.9rem' }}>No businesses found</p></div>
              ) : filtered.map(biz => (
                <div key={biz.id} ref={el => { cardRefs.current[biz.id] = el }}
                  onClick={() => setSelectedId(biz.id)}
                  style={{ backgroundColor: selectedId === biz.id ? '#1a1200' : '#111', border: `1px solid ${selectedId === biz.id ? '#c9933a' : '#222'}`, borderRadius: '0.875rem', padding: '0.875rem', marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, backgroundColor: '#222', position: 'relative' }}>
                      {biz.coverImage ? <Image src={biz.coverImage} alt={biz.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{getCategoryEmoji(biz.category)}</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{biz.name}</span>
                        {biz.subscription === 'PRO' && <span style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.1rem 0.35rem', borderRadius: '1rem', fontSize: '0.6rem', fontWeight: '800', flexShrink: 0 }}>PRO</span>}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.35rem' }}>{getCatName(biz.category).replace(/_/g, ' ')} · 📍 {biz.city}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {biz.rating ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><span style={{ color: '#f5c842', fontSize: '0.75rem' }}>★</span><span style={{ fontWeight: '700', fontSize: '0.75rem' }}>{biz.rating}</span></div> : <span style={{ color: '#444', fontSize: '0.7rem' }}>New</span>}
                        <Link href={`/business/${biz.slug}`} onClick={e => e.stopPropagation()} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.25rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: '700', textDecoration: 'none' }}>View →</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative', backgroundColor: '#111' }}>
            <GoogleMap businesses={filtered} selectedId={selectedId} onSelect={handleSelect} city={city} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .desktop-filters { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
          .biz-grid { grid-template-columns: repeat(2, 1fr) !important; min-width: 0 !important; gap: 0.5rem !important; }
          .biz-card img, .biz-card > div:first-child { height: 95px !important; }
          
          .map-container { flex-direction: column !important; height: auto !important; }
          .map-list { width: 100% !important; max-height: 260px !important; border-right: none !important; border-bottom: 1px solid #222 !important; }
          .map-container > div:last-child { height: 50vh !important; min-height: 300px !important; }
        }

        @media (max-width: 480px) {
          .biz-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseContent />
    </Suspense>
  )
}