'use client'
import { useState } from 'react'
import Link from 'next/link'

// Sample data — will be replaced with real database data later
const sampleBusiness = {
  name: 'Selam Hair Studio',
  category: 'Hair Styling',
  city: 'Toronto',
  province: 'ON',
  address: 'Little Ethiopia, Toronto',
  bio: 'Welcome to Selam Hair Studio! We specialize in natural hair care, braiding, and styling for the Habesha community in Toronto. With over 10 years of experience, we bring the best of Ethiopian and Eritrean hair traditions to Canada.',
  phone: '+1 (416) 555-0123',
  email: 'selam@example.com',
  instagram: '@selamhair',
  rating: 4.8,
  reviewCount: 24,
  isVerified: true,
  subscription: 'PRO',
  services: [
    { name: 'Hair Braiding', price: 80, duration: 120, photo: '/categories/hair-styling.jpg' },
    { name: 'Natural Styling', price: 60, duration: 60, photo: '/categories/makeup.jpg' },
    { name: 'Hair Treatment', price: 45, duration: 45, photo: '/categories/barber.jpg' },
    { name: 'Wash & Style', price: 50, duration: 60, photo: null },
  ],
  employees: [
    { name: 'Selam T.', specialty: 'Braiding & Natural Hair', avatar: 'S' },
    { name: 'Meron A.', specialty: 'Color & Treatment', avatar: 'M' },
    { name: 'Tigist B.', specialty: 'Traditional Styles', avatar: 'T' },
  ],
  hours: [
    { day: 'Monday', open: '9:00 AM', close: '6:00 PM', closed: false },
    { day: 'Tuesday', open: '9:00 AM', close: '6:00 PM', closed: false },
    { day: 'Wednesday', open: '9:00 AM', close: '6:00 PM', closed: false },
    { day: 'Thursday', open: '9:00 AM', close: '6:00 PM', closed: false },
    { day: 'Friday', open: '9:00 AM', close: '7:00 PM', closed: false },
    { day: 'Saturday', open: '10:00 AM', close: '5:00 PM', closed: false },
    { day: 'Sunday', open: '', close: '', closed: true },
  ],
  reviews: [
    { name: 'Hana M.', rating: 5, comment: 'Amazing service! Selam did an incredible job with my hair. Will definitely be back.', date: '2 weeks ago' },
    { name: 'Sara T.', rating: 5, comment: 'Best hair studio in Toronto for natural hair. Very professional and friendly.', date: '1 month ago' },
    { name: 'Liya K.', rating: 4, comment: 'Great experience overall. The braiding was beautiful and lasted a long time.', date: '1 month ago' },
  ],
}

export default function BusinessProfilePage() {
  const [activeTab, setActiveTab] = useState<'services' | 'employees' | 'reviews' | 'hours'>('services')
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const b = sampleBusiness

  const tabStyle = (active: boolean) => ({
    padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
    fontWeight: '600' as const, fontSize: '0.9rem',
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    backgroundColor: active ? '#c9933a' : 'transparent',
    color: active ? '#0a0a0a' : '#888',
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
          <Link href="/browse" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>← Browse</Link>
          <Link href="/login" style={{
            backgroundColor: '#c9933a', color: '#0a0a0a',
            padding: '0.5rem 1.25rem', borderRadius: '0.75rem',
            fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none',
          }}>Sign In to Book</Link>
        </div>
      </nav>

      {/* HERO BANNER */}
      <div style={{
        height: '220px', backgroundColor: '#111',
        background: 'linear-gradient(135deg, #1a1200 0%, #111 50%, #0a0a0a 100%)',
        position: 'relative',
        borderBottom: '1px solid #222',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, #0a0a0a 100%)',
        }} />
      </div>

      {/* PROFILE HEADER */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ marginTop: '-60px', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* AVATAR */}
            <div style={{
              width: '100px', height: '100px', borderRadius: '1.25rem',
              backgroundColor: '#c9933a', border: '4px solid #0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: '800', color: '#0a0a0a', flexShrink: 0,
            }}>
              {b.name.charAt(0)}
            </div>
            {/* INFO */}
            <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>{b.name}</h1>
                {b.isVerified && (
                  <span style={{
                    backgroundColor: '#c9933a', color: '#0a0a0a',
                    padding: '0.2rem 0.6rem', borderRadius: '1rem',
                    fontSize: '0.75rem', fontWeight: '700',
                  }}>✓ Verified</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', color: '#888', fontSize: '0.9rem' }}>
                <span>📍 {b.address}, {b.city}</span>
                <span>✂️ {b.category}</span>
                <span style={{ color: '#f5c842' }}>
                  {'★'.repeat(Math.floor(b.rating))} <span style={{ color: '#f5f0e8' }}>{b.rating}</span>
                  <span style={{ color: '#888' }}> ({b.reviewCount} reviews)</span>
                </span>
              </div>
            </div>
            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setSaved(!saved)}
                style={{
                  backgroundColor: saved ? '#1a1200' : '#111',
                  border: `1px solid ${saved ? '#c9933a' : '#333'}`,
                  color: saved ? '#c9933a' : '#888',
                  padding: '0.6rem 1rem', borderRadius: '0.75rem',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
                  transition: 'all 0.2s',
                }}>
                {saved ? '❤️ Saved' : '🤍 Save'}
              </button>
              <a href={`tel:${b.phone}`} style={{
                backgroundColor: '#111', border: '1px solid #333',
                color: '#f5f0e8', padding: '0.6rem 1rem', borderRadius: '0.75rem',
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}>
                📞 Call
              </a>
            </div>
          </div>

          {/* BIO */}
          <div style={{
            backgroundColor: '#111', border: '1px solid #222',
            borderRadius: '1rem', padding: '1.25rem', marginTop: '1.5rem',
          }}>
            <p style={{ color: '#ccc', lineHeight: '1.7', fontSize: '0.95rem', margin: 0 }}>{b.bio}</p>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', paddingBottom: '4rem' }}>

          {/* LEFT COLUMN */}
          <div>
            {/* TABS */}
            <div style={{
              display: 'flex', gap: '0.4rem', marginBottom: '1.5rem',
              backgroundColor: '#111', borderRadius: '1rem',
              padding: '0.4rem', border: '1px solid #222',
            }}>
              {(['services', 'employees', 'reviews', 'hours'] as const).map(tab => (
                <button key={tab} style={tabStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* SERVICES */}
            {activeTab === 'services' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', animation: 'fadeInUp 0.3s ease both' }}>
                {b.services.map(service => (
                <div key={service.name}
                    onClick={() => setSelectedService(selectedService === service.name ? null : service.name)}
                    style={{
                    backgroundColor: '#111',
                    border: `2px solid ${selectedService === service.name ? '#c9933a' : '#222'}`,
                    borderRadius: '1rem', overflow: 'hidden',
                    cursor: 'pointer', transition: 'all 0.2s',
                    transform: selectedService === service.name ? 'scale(1.02)' : 'scale(1)',
                    }}>
                    {/* SERVICE PHOTO */}
                    <div style={{ height: '140px', backgroundColor: '#222', position: 'relative', overflow: 'hidden' }}>
                    {service.photo ? (
                        <img src={service.photo} alt={service.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover',
                            transform: selectedService === service.name ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.3s ease',
                        }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>💼</div>
                    )}
                    {/* OVERLAY */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                    }} />
                    {selectedService === service.name && (
                        <div style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        backgroundColor: '#c9933a', color: '#0a0a0a',
                        padding: '0.25rem 0.6rem', borderRadius: '1rem',
                        fontSize: '0.75rem', fontWeight: '700',
                        }}>✓ Selected</div>
                    )}
                    </div>
                    {/* SERVICE INFO */}
                    <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{service.name}</span>
                        <span style={{ color: '#c9933a', fontWeight: '800', fontSize: '1rem' }}>${service.price}</span>
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.25rem' }}>⏱ {service.duration} mins</div>
                    </div>
                </div>
                ))}
            </div>
            )}

            {/* EMPLOYEES */}
            {activeTab === 'employees' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', animation: 'fadeInUp 0.3s ease both' }}>
                {b.employees.map(emp => (
                  <div key={emp.name}
                    onClick={() => setSelectedEmployee(selectedEmployee === emp.name ? null : emp.name)}
                    style={{
                      backgroundColor: '#111', border: `1px solid ${selectedEmployee === emp.name ? '#c9933a' : '#222'}`,
                      borderRadius: '1rem', padding: '1.5rem', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      backgroundColor: '#c9933a', margin: '0 auto 0.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: '800', color: '#0a0a0a',
                    }}>{emp.avatar}</div>
                    <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{emp.name}</div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>{emp.specialty}</div>
                    {selectedEmployee === emp.name && (
                      <div style={{ marginTop: '0.75rem', color: '#c9933a', fontSize: '0.85rem', fontWeight: '600' }}>✓ Selected</div>
                    )}
                  </div>
                ))}
                <div onClick={() => setSelectedEmployee(null)} style={{
                  backgroundColor: '#111', border: `1px solid ${!selectedEmployee ? '#c9933a' : '#222'}`,
                  borderRadius: '1rem', padding: '1.5rem', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#222', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎲</div>
                  <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>No Preference</div>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>Any available</div>
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
              <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
                {/* RATING SUMMARY */}
                <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: '#c9933a' }}>{b.rating}</div>
                    <div style={{ color: '#f5c842', fontSize: '1.25rem' }}>{'★'.repeat(Math.floor(b.rating))}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{b.reviewCount} reviews</div>
                </div>
                <div style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#888', fontSize: '0.8rem', width: '20px' }}>{star}★</span>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#222', borderRadius: '3px' }}>
                        <div style={{ width: star === 5 ? '75%' : star === 4 ? '20%' : '5%', height: '100%', backgroundColor: '#c9933a', borderRadius: '3px' }} />
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                {/* REVIEWS LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {b.reviews.map((review, i) => (
                    <div key={i} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: '#c9933a' }}>
                            {review.name.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{review.name}</div>
                            <div style={{ color: '#f5c842', fontSize: '0.8rem' }}>{'★'.repeat(review.rating)}</div>
                        </div>
                        </div>
                        <span style={{ color: '#555', fontSize: '0.8rem' }}>{review.date}</span>
                    </div>
                    <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{review.comment}</p>

                    {/* BUSINESS REPLY — Standard and Pro only */}
                    {b.subscription !== 'FREE' && (
                        <div style={{
                        marginTop: '1rem', padding: '0.875rem',
                        backgroundColor: '#0a0a0a', borderRadius: '0.75rem',
                        borderLeft: '3px solid #c9933a',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#c9933a' }}>
                            {b.name}
                            </span>
                            {b.subscription === 'PRO' && (
                            <span style={{ backgroundColor: '#c9933a', color: '#0a0a0a', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: '800' }}>PRO</span>
                            )}
                            <span style={{ color: '#555', fontSize: '0.75rem' }}>· Business Response</span>
                        </div>
                        <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                            Thank you so much for your kind words! We really appreciate your support and look forward to seeing you again soon. 🙏
                        </p>
                        </div>
                    )}
                    </div>
                ))}
                </div>

                {/* LEAVE A REVIEW */}
                <div style={{ marginTop: '1.5rem', backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.25rem' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.95rem' }}>Leave a Review</h4>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    You must be a registered client and have booked this business to leave a review.
                </p>
                <Link href="/login" style={{
                    display: 'inline-block', backgroundColor: '#c9933a', color: '#0a0a0a',
                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                    fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem',
                }}>
                    Sign In to Review
                </Link>
                </div>
            </div>
            )}

            {/* HOURS */}
            {activeTab === 'hours' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeInUp 0.3s ease both' }}>
                {b.hours.map(h => (
                  <div key={h.day} style={{
                    backgroundColor: '#111', border: '1px solid #222', borderRadius: '0.75rem',
                    padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: h.closed ? 0.5 : 1,
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', width: '100px' }}>{h.day}</span>
                    <span style={{ color: h.closed ? '#e05c5c' : '#4ade80', fontSize: '0.9rem' }}>
                      {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — BOOKING CARD */}
           <div style={{ position: 'sticky' as const, top: '80px', alignSelf: 'flex-start' }}>
            <div style={{
                backgroundColor: '#111', border: '1px solid #333',
                borderRadius: '1.25rem', padding: '1.5rem',
                animation: 'fadeInUp 0.5s ease 0.2s both',
            }}>
                <h3 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Book Appointment</h3>

                {/* SERVICE DROPDOWN */}
                <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
                    Service
                </label>
                <select
                    value={selectedService || ''}
                    onChange={e => setSelectedService(e.target.value || null)}
                    style={{
                    width: '100%', backgroundColor: '#0a0a0a',
                    border: '1px solid #333', borderRadius: '0.75rem',
                    padding: '0.75rem 1rem', color: selectedService ? '#f5f0e8' : '#888',
                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
                    cursor: 'pointer',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')}
                >
                    <option value="">Select a service</option>
                    {b.services.map(s => (
                    <option key={s.name} value={s.name}>
                        {s.name} — ${s.price} ({s.duration} mins)
                    </option>
                    ))}
                </select>
                </div>

                {/* EMPLOYEE DROPDOWN */}
                <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
                    Team Member
                </label>
                <select
                    value={selectedEmployee || ''}
                    onChange={e => setSelectedEmployee(e.target.value || null)}
                    style={{
                    width: '100%', backgroundColor: '#0a0a0a',
                    border: '1px solid #333', borderRadius: '0.75rem',
                    padding: '0.75rem 1rem', color: '#f5f0e8',
                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
                    cursor: 'pointer',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')}
                >
                    <option value="">No preference (any available)</option>
                    {b.employees.map(emp => (
                    <option key={emp.name} value={emp.name}>
                        {emp.name} — {emp.specialty}
                    </option>
                    ))}
                </select>
                </div>

                {/* SELECTED SUMMARY */}
                {selectedService && (
                <div style={{
                    backgroundColor: '#1a1200', border: '1px solid #c9933a33',
                    borderRadius: '0.75rem', padding: '0.75rem 1rem',
                    marginBottom: '1rem', fontSize: '0.85rem',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#888' }}>Service</span>
                    <span style={{ fontWeight: '600' }}>{selectedService}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#888' }}>Price</span>
                    <span style={{ fontWeight: '700', color: '#c9933a' }}>
                        ${b.services.find(s => s.name === selectedService)?.price}
                    </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Duration</span>
                    <span style={{ fontWeight: '600' }}>
                        {b.services.find(s => s.name === selectedService)?.duration} mins
                    </span>
                    </div>
                </div>
                )}

                {/* DATE */}
                {/* DATE */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Date</label>
                    <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                        width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333',
                        borderRadius: '0.75rem', padding: '0.75rem 1rem',
                        color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box' as const, cursor: 'pointer',
                        colorScheme: 'dark',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#333')}
                    />
                    </div>

                {/* NOTE */}
                <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Note (optional)</label>
                <textarea rows={3} placeholder="Any special requests..." style={{
                    width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #333',
                    borderRadius: '0.75rem', padding: '0.75rem 1rem',
                    color: '#f5f0e8', fontSize: '0.9rem', outline: 'none',
                    boxSizing: 'border-box' as const, resize: 'none' as const,
                }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
                </div>

                <Link href="/login" style={{
                display: 'block', width: '100%',
                backgroundColor: '#c9933a', color: '#0a0a0a',
                padding: '1rem', borderRadius: '0.75rem',
                fontWeight: '700', fontSize: '1rem', textDecoration: 'none',
                textAlign: 'center' as const, transition: 'all 0.2s',
                boxSizing: 'border-box' as const,
                opacity: selectedService ? 1 : 0.6,
                }}>
                {selectedService ? 'Sign In to Book' : 'Select a Service First'}
                </Link>

                <p style={{ textAlign: 'center', color: '#555', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                Free to use · No credit card required
                </p>

                {/* CONTACT */}
                <div style={{ borderTop: '1px solid #222', marginTop: '1.25rem', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href={`tel:${b.phone}`} style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📞 {b.phone}
                </a>
                <a href={`mailto:${b.email}`} style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ✉️ {b.email}
                </a>
                <span style={{ color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📸 {b.instagram}
                </span>
                </div>
            </div>
            </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: relative !important;
          }
        }
      `}</style>
    </main>
  )
}