'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function BusinessProfile() {
  const params = useParams()
  const slug = params.slug as string

  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('services')
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNote, setBookingNote] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [portfolio, setPortfolio] = useState<{ id: string; url: string }[]>([])
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Reviews state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
          // Check if already saved
          fetch(`/api/saved?businessSlug=${slug}`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }).then(r => r.json()).then(d => { if (d.saved) setSaved(true) }).catch(() => {})
        }
      })
    })
  }, [slug])

  useEffect(() => {
    if (!slug) return
    fetch(`/api/business/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.business) {
          setBusiness(data.business)
          setReviews(data.business.reviews || [])
        } else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Fetch portfolio photos
  useEffect(() => {
    if (!slug) return
    fetch(`/api/business/${slug}/portfolio`)
      .then(r => r.json())
      .then(data => { if (data.portfolio) setPortfolio(data.portfolio) })
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    if (portfolio.length > 0) setActiveTab('posts')
  }, [portfolio])

  useEffect(() => {
  // Track profile view (fire-and-forget)
  fetch(`/api/business/${slug}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {})
}, [slug])

  // Generate available time slots from business hours
  const getTimeSlots = () => {
    if (!bookingDate || !business?.businessHours) return []
    const dateObj = new Date(bookingDate + 'T12:00:00')
    // dayOfWeek in DB: Monday=0 based on dashboard, but we need to map correctly
    // businessHours uses dayOfWeek 0=Sunday in standard JS, but our DB uses 0=Monday
    const jsDay = dateObj.getDay() // 0=Sun, 1=Mon...6=Sat
    const dbDay = jsDay === 0 ? 6 : jsDay - 1 // convert to 0=Mon...6=Sun
    const hours = business.businessHours.find((h: any) => h.dayOfWeek === dbDay)
    if (!hours || hours.isClosed) return []

    const slots: string[] = []
    const [openH, openM] = hours.openTime.split(':').map(Number)
    const [closeH, closeM] = hours.closeTime.split(':').map(Number)
    let current = openH * 60 + openM
    const end = closeH * 60 + closeM

    // Get selected service duration for slot intervals
    const service = business.services?.find((s: any) => s.name === selectedService)
    const interval = service?.duration || 60

    while (current + interval <= end) {
      const h = Math.floor(current / 60)
      const m = current % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      current += interval
    }
    return slots
  }

  const timeSlots = getTimeSlots()

  const handleSave = async () => {
    if (!user) { window.location.href = '/login'; return }
    setSaveLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/saved', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ businessId: business.id }),
      })
      const data = await res.json()
      if (data.success) setSaved(!saved)
    } catch { } finally { setSaveLoading(false) }
  }

  const handleBooking = async () => {
    if (!selectedService || !bookingDate || !bookingTime) {
      alert('Please select a service, date and time')
      return
    }
    setBookingLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const service = business.services?.find((s: any) => s.name === selectedService)
      const employee = business.employees?.find((e: any) => e.name === selectedEmployee)
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ businessId: business.id, serviceId: service?.id || null, employeeId: employee?.id || null, date: bookingDate, startTime: bookingTime, notes: bookingNote }),
      })
      const data = await res.json()
      if (data.booking) setBookingSuccess(true)
      else alert('Booking failed. Please try again.')
    } catch { alert('Booking failed.') } finally { setBookingLoading(false) }
  }

  const handleReview = async () => {
    if (!user) { window.location.href = '/login'; return }
    if (!reviewComment.trim()) { setReviewMsg('Please write a comment'); return }
    setReviewLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ businessId: business.id, rating: reviewRating, comment: reviewComment }),
      })
      const data = await res.json()
      if (data.review) {
        setReviews(prev => [data.review, ...prev])
        setReviewComment('')
        setReviewRating(5)
        setReviewMsg('✓ Review submitted!')
        setTimeout(() => setReviewMsg(''), 3000)
      } else setReviewMsg(data.error || 'Failed to submit review')
    } catch { setReviewMsg('Failed to submit') } finally { setReviewLoading(false) }
  }

  if (loading) return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5f0e8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #333', borderTopColor: '#c9933a', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#888' }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  )

  if (notFound) return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5f0e8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>Business not found</h1>
        <Link href="/browse" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: '700' }}>Browse Businesses</Link>
      </div>
    </main>
  )

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null
  const categoryLabel = business.category?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/browse" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>← Browse</Link>
          {user ? (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#c9933a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: '#0a0a0a' }}>
              {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          ) : (
            <Link href="/login" style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none' }}>Sign In</Link>
          )}
        </div>
      </nav>

      {/* COVER */}
      <div style={{ height: '220px', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
        {business.media?.find((m: any) => m.caption === 'cover')?.url ? (
          <img src={business.media.find((m: any) => m.caption === 'cover').url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1200 0%, #0a0a0a 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, opacity: 0.4, background: 'radial-gradient(circle at 30% 50%, #c9933a22 0%, transparent 70%)' }} />
          </>
        )}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
        {/* PROFILE HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginTop: '-10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '1rem', backgroundColor: '#222', border: '3px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0, overflow: 'hidden' }}>
            {business.media?.find((m: any) => m.caption === 'logo')?.url
              ? <img src={business.media.find((m: any) => m.caption === 'logo').url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : business.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, paddingBottom: '0.5rem', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>{business.name}</h1>
              {business.isVerified && <span style={{ backgroundColor: '#4ade8022', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700' }}>✓ Verified</span>}
              {business.subscription === 'PRO' && <span style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '800' }}>⭐ PRO</span>}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>📍 {business.city}, {business.province}</span>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>✂️ {categoryLabel}</span>
              {avgRating
                ? <span style={{ color: '#f5c842', fontSize: '0.9rem' }}>★ {avgRating} ({reviews.length} reviews)</span>
                : <span style={{ color: '#555', fontSize: '0.9rem' }}>No reviews yet</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.5rem' }}>
            <button onClick={handleSave} disabled={saveLoading} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1px solid ${saved ? '#c9933a' : '#333'}`, backgroundColor: saved ? '#c9933a22' : 'transparent', color: saved ? '#c9933a' : '#888', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
              {saveLoading ? '...' : saved ? '♥ Saved' : '♡ Save'}
            </button>
            {business.phone && <a href={`tel:${business.phone}`} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #333', backgroundColor: '#111', color: '#f5f0e8', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>📞 Call</a>}
          </div>
        </div>

        {/* BIO */}
        {business.description && (
          <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#ccc', lineHeight: '1.7', margin: 0 }}>{business.description}</p>
          </div>
        )}


        {/* TWO COLUMN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT — TABS */}
          <div>
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#111', borderRadius: '1rem', padding: '0.25rem', marginBottom: '1.5rem', border: '1px solid #222' }}>
              {['posts','services', 'employees', 'reviews', 'hours'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', backgroundColor: activeTab === tab ? '#c9933a' : 'transparent', color: activeTab === tab ? '#0a0a0a' : '#888', fontWeight: '600', fontSize: '0.85rem', textTransform: 'capitalize' as const, transition: 'all 0.2s' }}>
                  {tab === 'posts' ? '📸 Posts' : tab}
                  {tab === 'reviews' && reviews.length > 0 ? ` (${reviews.length})` : ''}
                  {tab === 'posts' && portfolio.length > 0 ? ` (${portfolio.length})` : ''}
                </button>
              ))}
            </div>

            {/* posts */}
            {activeTab === 'posts' && (
              <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
                {portfolio.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                    <div style={{ fontSize: '2rem' }}>🖼️</div>
                    <p>No portfolio photos yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {portfolio.map(item => (
                      <div key={item.id} onClick={() => setLightboxImg(item.url)}
                        style={{ aspectRatio: '1' as never, borderRadius: '0.875rem', overflow: 'hidden', cursor: 'pointer', backgroundColor: '#111', border: '1px solid #222', transition: 'transform 0.2s, border-color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#c9933a' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#222' }}>
                        <img src={item.url} alt="portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SERVICES */}
            {activeTab === 'services' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', animation: 'fadeInUp 0.3s ease both' }}>
                {business.services?.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#888' }}><div style={{ fontSize: '2rem' }}>💼</div><p>No services listed yet</p></div>}
                {business.services?.map((service: any) => (
                  <div key={service.id} onClick={() => setSelectedService(selectedService === service.name ? null : service.name)} style={{ backgroundColor: '#111', border: `2px solid ${selectedService === service.name ? '#c9933a' : '#222'}`, borderRadius: '1rem', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', transform: selectedService === service.name ? 'scale(1.02)' : 'scale(1)' }}>
                    <div style={{ height: '140px', backgroundColor: '#1a1a1a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {service.media?.[0]?.url ? <img src={service.media[0].url} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '2.5rem' }}>💼</div>}
                      {selectedService === service.name && <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '800' }}>✓ Selected</div>}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{service.name}</span>
                        <span style={{ color: '#c9933a', fontWeight: '800' }}>${service.price}</span>
                      </div>
                      {service.duration && <div style={{ color: '#888', fontSize: '0.8rem' }}>⏱ {service.duration} mins</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EMPLOYEES */}
            {activeTab === 'employees' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', animation: 'fadeInUp 0.3s ease both' }}>
                <div onClick={() => setSelectedEmployee(null)} style={{ backgroundColor: '#111', border: `2px solid ${selectedEmployee === null ? '#c9933a' : '#222'}`, borderRadius: '1rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎲</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>No Preference</div>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>Any available</div>
                </div>
                {business.employees?.map((emp: any) => (
                  <div key={emp.id} onClick={() => setSelectedEmployee(selectedEmployee === emp.name ? null : emp.name)} style={{ backgroundColor: '#111', border: `2px solid ${selectedEmployee === emp.name ? '#c9933a' : '#222'}`, borderRadius: '1rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#222', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden' }}>
                      {emp.avatarUrl ? <img src={emp.avatarUrl} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{emp.name}</div>
                    {emp.specialty && <div style={{ color: '#888', fontSize: '0.8rem' }}>{emp.specialty}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
              <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
                {reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}><div style={{ fontSize: '2rem' }}>⭐</div><p>No reviews yet — be the first!</p></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {reviews.map((review: any) => (
                      <div key={review.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#c9933a' }}>{review.client?.fullName?.charAt(0) || '?'}</div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{review.client?.fullName || 'Anonymous'}</div>
                              <div style={{ color: '#f5c842', fontSize: '0.9rem' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                            </div>
                          </div>
                          <span style={{ color: '#555', fontSize: '0.8rem' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        {review.comment && <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{review.comment}</p>}
                        {review.response && (
                          <div style={{ marginTop: '1rem', padding: '0.875rem', backgroundColor: '#0a0a0a', borderRadius: '0.75rem', borderLeft: '3px solid #c9933a' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#c9933a', marginBottom: '0.4rem' }}>{business.name} · Response</div>
                            <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>{review.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* WRITE REVIEW */}
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    {user ? 'Leave a Review' : 'Sign in to leave a review'}
                  </h4>
                  {user ? (
                    <>
                      {reviewMsg && <div style={{ padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1rem', backgroundColor: reviewMsg.startsWith('✓') ? '#0a1f0a' : '#1f0a0a', color: reviewMsg.startsWith('✓') ? '#4ade80' : '#e05c5c', fontWeight: '600', fontSize: '0.85rem' }}>{reviewMsg}</div>}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.4rem' }}>Rating</label>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setReviewRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: star <= reviewRating ? '#f5c842' : '#333', transition: 'color 0.1s' }}>★</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.4rem' }}>Your Review</label>
                        <textarea rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..." style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                      </div>
                      <button onClick={handleReview} disabled={reviewLoading} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', cursor: reviewLoading ? 'not-allowed' : 'pointer', opacity: reviewLoading ? 0.7 : 1 }}>
                        {reviewLoading ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </>
                  ) : (
                    <Link href="/login" style={{ display: 'inline-block', backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>Sign In to Review</Link>
                  )}
                </div>
              </div>
            )}

            {/* HOURS */}
            {activeTab === 'hours' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeInUp 0.3s ease both' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => {
                  const h = business.businessHours?.find((bh: any) => bh.dayOfWeek === i)
                  return (
                    <div key={day} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{day}</span>
                      <span style={{ color: h?.isClosed ? '#e05c5c' : '#4ade80', fontSize: '0.9rem' }}>
                        {!h ? 'Not set' : h.isClosed ? 'Closed' : `${h.openTime} – ${h.closeTime}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT — BOOKING CARD */}
          <div style={{ position: 'sticky' as const, top: '80px' }}>
            <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '1.25rem', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Book Appointment</h3>

              {/* SERVICE */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Service</label>
                <select value={selectedService || ''} onChange={e => { setSelectedService(e.target.value || null); setBookingTime('') }} style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: selectedService ? '#f5f0e8' : '#888', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const, colorScheme: 'dark' as never }}>
                  <option value="">Select a service</option>
                  {business.services?.map((s: any) => <option key={s.id} value={s.name}>{s.name} — ${s.price} ({s.duration} mins)</option>)}
                </select>
              </div>

              {/* EMPLOYEE */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Team Member</label>
                <select value={selectedEmployee || ''} onChange={e => setSelectedEmployee(e.target.value || null)} style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const, colorScheme: 'dark' as never }}>
                  <option value="">No preference</option>
                  {business.employees?.map((emp: any) => <option key={emp.id} value={emp.name}>{emp.name}{emp.specialty ? ` — ${emp.specialty}` : ''}</option>)}
                </select>
              </div>

              {/* DATE */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Date</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={bookingDate} onChange={e => { setBookingDate(e.target.value); setBookingTime('') }}
                  style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const, colorScheme: 'dark' as never }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
              </div>

              {/* TIME SLOTS */}
              {bookingDate && selectedService && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Available Time Slots</label>
                  {timeSlots.length === 0 ? (
                    <div style={{ backgroundColor: '#1f0a0a', border: '1px solid #e05c5c33', borderRadius: '0.75rem', padding: '0.75rem', fontSize: '0.85rem', color: '#e05c5c', textAlign: 'center' }}>Closed on this day</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                      {timeSlots.map(slot => (
                        <button key={slot} onClick={() => setBookingTime(slot)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: `1px solid ${bookingTime === slot ? '#c9933a' : '#333'}`, backgroundColor: bookingTime === slot ? '#c9933a' : '#0a0a0a', color: bookingTime === slot ? '#0a0a0a' : '#888', cursor: 'pointer', fontSize: '0.8rem', fontWeight: bookingTime === slot ? '700' : '400', transition: 'all 0.15s' }}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUMMARY */}
              {selectedService && bookingTime && (
                <div style={{ backgroundColor: '#1a1200', border: '1px solid #c9933a33', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ color: '#888' }}>Service</span><span style={{ fontWeight: '600' }}>{selectedService}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ color: '#888' }}>Price</span><span style={{ fontWeight: '700', color: '#c9933a' }}>${business.services?.find((s: any) => s.name === selectedService)?.price}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ color: '#888' }}>Date</span><span>{bookingDate}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Time</span><span style={{ color: '#4ade80', fontWeight: '700' }}>{bookingTime}</span></div>
                </div>
              )}

              {/* NOTE */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Note (optional)</label>
                <textarea rows={2} placeholder="Any special requests..." value={bookingNote} onChange={e => setBookingNote(e.target.value)} style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const, resize: 'none' as const }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
              </div>

              {/* BOOK BUTTON */}
              {bookingSuccess ? (
                <div style={{ backgroundColor: '#0a1f0a', border: '1px solid #4ade80', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
                  <div style={{ fontWeight: '700', color: '#4ade80', marginBottom: '0.25rem' }}>Booking Requested!</div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>The business will confirm shortly.</div>
                </div>
              ) : selectedService && bookingTime ? (
                user ? (
                  <button onClick={handleBooking} disabled={bookingLoading} style={{ width: '100%', backgroundColor: bookingLoading ? '#7a5820' : '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: bookingLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {bookingLoading ? <><span style={{ width: '16px', height: '16px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Booking...</> : `Book ${bookingTime}`}
                  </button>
                ) : (
                  <button onClick={() => { localStorage.setItem('bookingReturn', `/business/${business.slug}`); window.location.href = '/login' }} style={{ width: '100%', backgroundColor: '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: 'pointer' }}>Sign In to Book</button>
                )
              ) : (
                <button disabled style={{ width: '100%', backgroundColor: '#c9933a', color: '#0a0a0a', padding: '1rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: 'not-allowed', opacity: 0.5 }}>
                  {!selectedService ? 'Select a Service First' : !bookingDate ? 'Pick a Date' : 'Pick a Time Slot'}
                </button>
              )}

              <p style={{ textAlign: 'center', color: '#555', fontSize: '0.8rem', marginTop: '0.75rem' }}>Free to use · No credit card required</p>

              {(business.phone || business.instagram) && (
                <div style={{ borderTop: '1px solid #222', marginTop: '1.25rem', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {business.phone && <a href={`tel:${business.phone}`} style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>📞 {business.phone}</a>}
                  {business.instagram && <span style={{ color: '#888', fontSize: '0.85rem' }}>📸 {business.instagram}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightboxImg} alt="portfolio" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '0.75rem' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.6)', border: '1px solid #444', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
      )}

      <div style={{ height: '4rem' }} />
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}