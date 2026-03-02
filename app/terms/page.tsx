'use client'

import Link from 'next/link'

export default function TermsPage() {
  const lastUpdated = 'February 24, 2026'

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing or using Meda ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform. These terms apply to all users, including clients and business owners registered on Meda.`,
    },
    {
      id: 'description',
      title: '2. Description of Service',
      content: `Meda is an online marketplace that connects clients with Eritrean and Ethiopian service businesses in Canada. The Platform allows business owners to create profiles, list services, manage bookings, and receive payments. Clients can discover businesses, book services, and leave reviews. Meda does not itself provide any of the services listed on the Platform.`,
    },
    {
      id: 'accounts',
      title: '3. User Accounts',
      content: `You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. Meda reserves the right to suspend or terminate accounts that violate these terms.`,
    },
    {
      id: 'conduct',
      title: '4. User Conduct',
      content: `You agree not to use the Platform to post false, misleading, or fraudulent content; harass, threaten, or harm other users; violate any applicable Canadian federal or provincial laws; attempt to gain unauthorized access to the Platform or other users' accounts; use automated tools to scrape or extract data from the Platform; or impersonate any person or entity. Meda reserves the right to remove any content that violates these conduct rules without prior notice.`,
    },
    {
      id: 'business-owners',
      title: '5. Business Owner Responsibilities',
      content: `Business owners are solely responsible for the accuracy of their business profile, service listings, pricing, and availability. Business owners must honour confirmed bookings unless a cancellation is made in accordance with their stated cancellation policy. Business owners are responsible for complying with all applicable Canadian laws, including licensing, tax obligations, and consumer protection regulations. Meda is not liable for any disputes arising between business owners and clients.`,
    },
    {
      id: 'bookings',
      title: '6. Booking & Cancellation Policy',
      content: `Bookings are confirmed when a business owner accepts a client's booking request. Clients should review each business's individual cancellation policy before booking. Cancellations must be made in accordance with the business's stated policy. Meda does not guarantee refunds for cancellations and is not responsible for resolving disputes between clients and business owners regarding cancellations. In cases of no-shows or repeated cancellations, Meda reserves the right to suspend accounts.`,
    },
    {
      id: 'payments',
      title: '7. Subscription & Payments',
      content: `Meda offers Free, Standard ($19/month CAD), and Pro ($39/month CAD) subscription plans for business owners. Subscription fees are billed monthly and are non-refundable unless required by applicable law. Payments are processed securely through Stripe. By subscribing, you authorize Meda to charge your payment method on a recurring monthly basis. You may cancel your subscription at any time through your dashboard; cancellation takes effect at the end of the current billing period. Meda reserves the right to modify subscription pricing with 30 days' notice.`,
    },
    {
      id: 'intellectual-property',
      title: '8. Intellectual Property',
      content: `All content on the Meda platform, including but not limited to logos, design, text, and software, is owned by Meda or its licensors and is protected under Canadian copyright law. Users retain ownership of content they upload (such as business photos and descriptions) but grant Meda a non-exclusive, royalty-free licence to use, display, and distribute such content on the Platform for the purposes of operating the service.`,
    },
    {
      id: 'disclaimer',
      title: '9. Disclaimer of Warranties',
      content: `The Platform is provided "as is" without warranties of any kind, either express or implied. Meda does not warrant that the Platform will be uninterrupted, error-free, or free of viruses. Meda does not endorse or verify any business listed on the Platform and makes no representations about the quality of services provided by business owners.`,
    },
    {
      id: 'liability',
      title: '10. Limitation of Liability',
      content: `To the fullest extent permitted by applicable Canadian law, Meda shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Meda's total liability to you for any claim shall not exceed the amount you paid to Meda in the 12 months preceding the claim.`,
    },
    {
      id: 'governing-law',
      title: '11. Governing Law',
      content: `These Terms and Conditions are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes arising from these terms shall be resolved in the courts of Ontario, Canada.`,
    },
    {
      id: 'changes',
      title: '12. Changes to Terms',
      content: `Meda reserves the right to modify these Terms and Conditions at any time. We will notify users of significant changes via email or a prominent notice on the Platform. Continued use of the Platform after changes constitutes acceptance of the updated terms.`,
    },
    {
      id: 'contact',
      title: '13. Contact Us',
      content: `If you have any questions about these Terms and Conditions, please contact us at legal@medaeritrean.com or through our contact page.`,
    },
  ]

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>
      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/privacy" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }} onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Privacy Policy</Link>
          <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }} onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Home</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid #222' }}>
          <div style={{ display: 'inline-block', backgroundColor: '#1a1200', border: '1px solid #c9933a44', borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#c9933a', fontWeight: '600', marginBottom: '1.25rem' }}>Legal</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem', lineHeight: 1.2 }}>Terms & Conditions</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Last updated: {lastUpdated}</p>
          <p style={{ color: '#aaa', fontSize: '0.95rem', marginTop: '1rem', lineHeight: 1.7 }}>
            Please read these Terms and Conditions carefully before using Meda. These terms govern your use of our platform as a client or business owner.
          </p>
        </div>

        {/* TABLE OF CONTENTS */}
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Table of Contents</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ color: '#c9933a', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                <span style={{ color: '#444', fontSize: '0.8rem' }}>→</span> {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {sections.map(s => (
            <div key={s.id} id={s.id} style={{ scrollMarginTop: '80px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#c9933a', marginBottom: '0.75rem' }}>{s.title}</h2>
              <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '0.95rem' }}>{s.content}</p>
            </div>
          ))}
        </div>

        {/* FOOTER LINKS */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #222', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#c9933a', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>Privacy Policy →</Link>
          <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}