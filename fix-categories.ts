/**
 * fix-categories.ts
 * 
 * Run with:  npx ts-node --skip-project fix-categories.ts
 * 
 * Step 1: Audits your Category table and shows you what's top-level vs nested.
 * Step 2: Lets you reassign subcategories to the correct parent.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n========================================')
  console.log('  MEDA — Category Audit & Fix Script')
  console.log('========================================\n')

  // ── 1. Fetch all categories ──────────────────────────────────────────────
  const all = await prisma.category.findMany({
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  })

  const topLevel  = all.filter(c => c.parentId === null)
  const children  = all.filter(c => c.parentId !== null)

  // ── 2. Print current top-level categories ────────────────────────────────
  console.log(`TOP-LEVEL categories (parentId = null): ${topLevel.length}`)
  console.log('─────────────────────────────────────────')
  topLevel.forEach(c => console.log(`  [${c.id}]  ${c.name}  (slug: ${c.slug})`))

  // ── 3. Print current subcategories ───────────────────────────────────────
  console.log(`\nSUBCATEGORIES (parentId set): ${children.length}`)
  console.log('─────────────────────────────────────────')
  children.forEach(c => {
    const parent = all.find(p => p.id === c.parentId)
    console.log(`  [${c.id}]  ${c.name}  → parent: ${parent?.name ?? c.parentId}`)
  })

  // ── 4. CONFIGURE YOUR FIXES HERE ─────────────────────────────────────────
  //
  // If any subcategories are showing up in topLevel above that should be nested,
  // add them here. Format:
  //
  //   { childSlug: 'makeup-artists', parentSlug: 'beauty-wellness' },
  //
  // Leave this array EMPTY if you don't want to apply any fixes yet —
  // the script will just print the audit and exit safely.
  //
  const fixes: { childSlug: string; parentSlug: string }[] = [
    // Examples — replace with your actual slugs from the audit above:
    // { childSlug: 'makeup-artists',   parentSlug: 'beauty-wellness' },
    // { childSlug: 'hair-salons',      parentSlug: 'beauty-wellness' },
    // { childSlug: 'barbershops',      parentSlug: 'beauty-wellness' },
  ]

  if (fixes.length === 0) {
    console.log('\n⚠️  No fixes configured. Review the audit above,')
    console.log('   then add entries to the `fixes` array and re-run.\n')
    await prisma.$disconnect()
    return
  }

  // ── 5. Apply fixes ───────────────────────────────────────────────────────
  console.log('\nApplying fixes...')
  console.log('─────────────────────────────────────────')

  for (const fix of fixes) {
    const child  = all.find(c => c.slug === fix.childSlug)
    const parent = all.find(c => c.slug === fix.parentSlug)

    if (!child) {
      console.log(`  ✗  Child slug "${fix.childSlug}" not found — skipping`)
      continue
    }
    if (!parent) {
      console.log(`  ✗  Parent slug "${fix.parentSlug}" not found — skipping`)
      continue
    }
    if (parent.parentId !== null) {
      console.log(`  ✗  "${fix.parentSlug}" is itself a subcategory — can't use as parent`)
      continue
    }

    await prisma.category.update({
      where: { id: child.id },
      data:  { parentId: parent.id },
    })

    console.log(`  ✓  "${child.name}" → parent set to "${parent.name}"`)
  }

  // ── 6. Final state ───────────────────────────────────────────────────────
  const updated = await prisma.category.findMany({
    where:   { parentId: null },
    include: { subcategories: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  })

  console.log('\n✅ Done! Final top-level structure:')
  console.log('─────────────────────────────────────────')
  updated.forEach(p => {
    console.log(`  📁 ${p.name}`)
    p.subcategories.forEach((s: any) => console.log(`      └─ ${s.name}`))
  })

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1) })
