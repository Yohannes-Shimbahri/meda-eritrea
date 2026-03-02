'use client'


import Link from 'next/link'

export default function PrivacyPage() {
  const lastUpdated = 'February 24, 2026'

  const sections = [
    {
      id: 'overview',
      title: '1. Overview',
      content: `Meda ("we", "us", or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. We comply with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy laws.`,
    },
    {
      id: 'information-collected',
      title: '2. Information We Collect',
      content: `We collect information you provide directly to us, including: your name, email address, phone number, and password when you create an account; business name, address, description, photos, and service listings if you register as a business owner; booking details including dates, services selected, and notes; payment information processed securely through Stripe (we do not store your full card details); profile photos and any other content you upload to the Platform; and messages and communications between users on the Platform. We also automatically collect certain technical data such as your IP address, browser type, device information, and pages visited on our Platform.`,
    },
    {
      id: 'how-we-use',
      title: '3. How We Use Your Information',
      content: `We use your personal information to operate and improve the Meda platform; process bookings and payments; send you booking confirmations, reminders, and notifications; provide customer support; verify your identity and prevent fraud; communicate updates, promotions, and platform news (you may opt out at any time); comply with legal obligations; and analyze usage to improve our services. We do not sell your personal information to third parties.`,
    },
    {
      id: 'sharing',
      title: '4. How We Share Your Information',
      content: `We share your information only in the following circumstances: with business owners when you make a booking (your name, contact details, and booking information are shared); with clients when a business owner accepts a booking (business contact details are shared); with Stripe for payment processing; with Resend for transactional email delivery; with service providers who assist us in operating the Platform, under strict confidentiality agreements; when required by law, court order, or government authority; and in the event of a merger, acquisition, or sale of Meda's assets, with appropriate notice to users.`,
    },
    {
      id: 'cookies',
      title: '5. Cookies & Tracking',
      content: `We use cookies and similar tracking technologies to maintain your login session, remember your preferences, analyze how the Platform is used, and improve performance. You can control cookie settings through your browser. Disabling cookies may affect the functionality of certain features on the Platform. We do not use cookies for advertising or tracking you across other websites.`,
    },
    {
      id: 'data-retention',
      title: '6. Data Retention',
      content: `We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it by law (for example, financial records may be retained for up to 7 years as required by Canadian tax law). Booking history may be retained for dispute resolution purposes for up to 12 months after the booking date.`,
    },
    {
      id: 'your-rights',
      title: '7. Your Privacy Rights',
      content: `Under PIPEDA and applicable Canadian privacy law, you have the right to access the personal information we hold about you; request correction of inaccurate or incomplete information; withdraw consent to certain uses of your information; request deletion of your personal information (subject to legal retention requirements); and lodge a complaint with the Office of the Privacy Commissioner of Canada if you believe your privacy rights have been violated. To exercise any of these rights, please contact us at privacy@medaeritrean.com.`,
    },
    {
      id: 'security',
      title: '8. Data Security',
      content: `We implement industry-standard security measures to protect your personal information, including encryption of data in transit (HTTPS/TLS), secure authentication through Supabase, and restricted access to personal data on a need-to-know basis. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password and to notify us immediately if you suspect unauthorized access to your account.`,
    },
    {
      id: 'third-party',
      title: '9. Third-Party Services',
      content: `Our Platform integrates with third-party services including Stripe (payment processing), Supabase (authentication and database), Cloudinary (image storage), and Resend (email delivery). These services have their own privacy policies and we encourage you to review them. We are not responsible for the privacy practices of these third-party providers, though we only work with providers that meet our security and privacy standards.`,
    },
    {
      id: 'children',
      title: '10. Children\'s Privacy',
      content: `Meda is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal information, we will delete such information promptly. If you believe a child has provided us with personal information, please contact us immediately.`,
    },
    {
      id: 'changes',
      title: '11. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a prominent notice on the Platform at least 30 days before the changes take effect. Your continued use of the Platform after the effective date constitutes acceptance of the updated policy.`,
    },
    {
      id: 'contact',
      title: '12. Contact Us',
      content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Privacy Officer at privacy@medaeritrean.com. You may also write to us at: Meda Inc., Toronto, Ontario, Canada. We will respond to all privacy inquiries within 30 days.`,
    },
  ]

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8' }}>
      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#c9933a', textDecoration: 'none' }}>Meda</Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/terms" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }} onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Terms & Conditions</Link>
          <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }} onMouseEnter={e => (e.currentTarget.style.color = '#c9933a')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Home</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid #222' }}>
          <div style={{ display: 'inline-block', backgroundColor: '#0a1020', border: '1px solid #60a5fa44', borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#60a5fa', fontWeight: '600', marginBottom: '1.25rem' }}>Legal</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem', lineHeight: 1.2 }}>Privacy Policy</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Last updated: {lastUpdated}</p>
          <p style={{ color: '#aaa', fontSize: '0.95rem', marginTop: '1rem', lineHeight: 1.7 }}>
            Your privacy matters to us. This policy explains exactly what data we collect, how we use it, and your rights as a user of Meda. We comply with Canada's PIPEDA privacy legislation.
          </p>
        </div>

        {/* PIPEDA BADGE */}
        <div style={{ backgroundColor: '#0a1020', border: '1px solid #60a5fa33', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🇨🇦</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#60a5fa' }}>PIPEDA Compliant</div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>This policy complies with Canada's Personal Information Protection and Electronic Documents Act</div>
          </div>
        </div>

        {/* TABLE OF CONTENTS */}
        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Table of Contents</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                <span style={{ color: '#444', fontSize: '0.8rem' }}>→</span> {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {sections.map(s => (
            <div key={s.id} id={s.id} style={{ scrollMarginTop: '80px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#60a5fa', marginBottom: '0.75rem' }}>{s.title}</h2>
              <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '0.95rem' }}>{s.content}</p>
            </div>
          ))}
        </div>

        {/* FOOTER LINKS */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #222', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ color: '#c9933a', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>Terms & Conditions →</Link>
          <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}