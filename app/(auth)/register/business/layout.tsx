import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register Your Business',
  description: 'List your Habesha business on Meda and start accepting bookings from clients across Canada.',
  robots: { index: false, follow: false },
}

export default function RegisterBusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
