import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Meda — Habesha Businesses in Canada',
    template: '%s | Meda',
  },
  description: 'Find and book Habesha businesses across Canada. Hair styling, catering, barbers, makeup artists and more in Toronto, Calgary, Edmonton and beyond.',
  keywords: ['Habesha', 'Ethiopian', 'Eritrean', 'businesses', 'Canada', 'Toronto', 'book', 'appointments'],
  authors: [{ name: 'Meda' }],
  creator: 'Meda',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Meda',
    title: 'Meda — Habesha Businesses in Canada',
    description: 'Find and book Habesha businesses across Canada.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Meda' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meda — Habesha Businesses in Canada',
    description: 'Find and book Habesha businesses across Canada.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        {children}
      </body>
    </html>
  )
}