import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join Meda to discover and book Habesha businesses across Canada.',
  robots: { index: false, follow: false },
}

export default function RegisterClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
