const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Map business name keywords to category slugs
  const fixes = [
    { nameContains: 'barber', categorySlug: 'barber' },
    { nameContains: 'car sales', categorySlug: 'car-sales' },
  ]

  for (const fix of fixes) {
    const category = await prisma.category.findUnique({ where: { slug: fix.categorySlug } })
    if (!category) { console.log('Category not found:', fix.categorySlug); continue }

    const result = await prisma.business.updateMany({
      where: {
        categoryId: null,
        name: { contains: fix.nameContains, mode: 'insensitive' }
      },
      data: { categoryId: category.id }
    })
    console.log(`✓ Linked "${fix.nameContains}" businesses (${result.count} updated) → ${category.name}`)
  }

  // Show final state
  const businesses = await prisma.business.findMany({
    select: { name: true, categoryId: true },
    include: { category: { select: { name: true } } }
  })
  console.log('\nFinal state:')
  businesses.forEach(b => console.log(` - ${b.name}: ${b.category?.name || 'NO CATEGORY'}`)  )
}

main().catch(console.error).finally(() => prisma.$disconnect())
