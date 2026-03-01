import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Habesha Businesses',
  description: 'Search and filter Habesha businesses across Canada. Find hair stylists, barbers, caterers, makeup artists and more near you.',
  openGraph: {
    title: 'Browse Habesha Businesses | Meda',
    description: 'Search and filter Habesha businesses across Canada.',
  },
}

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
