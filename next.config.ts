import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/meda-eritrea\.vercel\.app\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/businesses.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-businesses',
        expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
      },
    },
    {
      urlPattern: /\/api\/admin\/categories.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-categories',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cloudinary-images',
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
  poweredByHeader: false,
}

module.exports = withPWA(nextConfig)