const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const CATEGORIES = [
  { name: 'Hair Styling', slug: 'hair-styling', icon: '💇', order: 1 },
  { name: 'Makeup', slug: 'makeup', icon: '💄', order: 2 },
  { name: 'Barber', slug: 'barber', icon: '💈', order: 3 },
  { name: 'Catering', slug: 'catering', icon: '🍽️', order: 4 },
  { name: 'Cameraman', slug: 'cameraman', icon: '🎥', order: 5 },
  { name: 'Event Decoration', slug: 'event-decoration', icon: '🎨', order: 6 },
  { name: 'Car Sales', slug: 'car-sales', icon: '🚗', order: 7 },
  { name: 'Baker', slug: 'baker', icon: '🍰', order: 8 },
  { name: 'Handy Services', slug: 'handy-services', icon: '🔧', order: 9 },
]

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat })
    console.log('✓', cat.name)
  }
  console.log('All done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())