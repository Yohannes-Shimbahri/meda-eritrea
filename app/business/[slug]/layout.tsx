import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const business = await (prisma as any).business.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      city: true,
      province: true,
      isVerified: true,
      category: { select: { name: true } },
      media: {
        where: { caption: 'cover', isPublished: true },
        take: 1,
        select: { url: true },
      },
    },
  })

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'This business could not be found on Meda.',
    }
  }

  const categoryName = business.category?.name || 'Business'
  const location = [business.city, business.province].filter(Boolean).join(', ')
  const title = `${business.name} — ${categoryName} in ${location}`
  const description = business.description
    ? business.description.slice(0, 155)
    : `Book ${business.name}, a ${categoryName} in ${location}. Find services, hours, and reviews on Meda.`

  const coverImage = business.media[0]?.url
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${siteUrl}/business/${slug}`,
      siteName: 'Meda',
      images: coverImage
        ? [{ url: coverImage, width: 1200, height: 630, alt: business.name }]
        : [{ url: `${siteUrl}/og-default.png`, width: 1200, height: 630, alt: 'Meda' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: coverImage ? [coverImage] : [`${siteUrl}/og-default.png`],
    },
    alternates: {
      canonical: `${siteUrl}/business/${slug}`,
    },
  }
}

export default function BusinessProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}