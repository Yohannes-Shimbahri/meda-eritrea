import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#c9933a',
}

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Meda',
  },
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
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="en">
      <head>
        <meta property="csp-nonce" content={nonce} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Meda" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  )
}