

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIES = [
  { name: 'Hair Styling',      slug: 'hair-styling',      icon: '💇',  order: 1 },
  { name: 'Makeup',            slug: 'makeup',            icon: '💄',  order: 2 },
  { name: 'Barber',            slug: 'barber',            icon: '💈',  order: 3 },
  { name: 'Catering',          slug: 'catering',          icon: '🍽️',  order: 4 },
  { name: 'Cameraman',         slug: 'cameraman',         icon: '🎥',  order: 5 },
  { name: 'Event Decoration',  slug: 'event-decoration',  icon: '🎨',  order: 6 },
  { name: 'Car Sales',         slug: 'car-sales',         icon: '🚗',  order: 7 },
  { name: 'Baker',             slug: 'baker',             icon: '🍰',  order: 8 },
  { name: 'Handy Services',    slug: 'handy-services',    icon: '🔧',  order: 9 },
]

async function main() {
  console.log('Seeding categories...')

  for (const cat of CATEGORIES) {
    await (prisma as any).category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    console.log(`✓ ${cat.name}`)
  }

  // Link existing businesses to their new category by matching legacy enum value
  const legacyMap: Record<string, string> = {
    HAIR_STYLING:     'hair-styling',
    MAKEUP:           'makeup',
    BARBER:           'barber',
    CATERING:         'catering',
    CAMERAMAN:        'cameraman',
    EVENT_DECORATION: 'event-decoration',
    CAR_SALES:        'car-sales',
    BAKER:            'baker',
    HANDY_SERVICES:   'handy-services',
  }

  const businesses = await (prisma as any).business.findMany({
    where: { categoryId: null, categoryLegacy: { not: null } }
  })

  for (const biz of businesses) {
    const slug = legacyMap[biz.categoryLegacy]
    if (!slug) continue
    const cat = await (prisma as any).category.findUnique({ where: { slug } })
    if (!cat) continue
    await (prisma as any).business.update({
      where: { id: biz.id },
      data: { categoryId: cat.id },
    })
    console.log(`Linked business "${biz.name}" → ${cat.name}`)
  }

  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
