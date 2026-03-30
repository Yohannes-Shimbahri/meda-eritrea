// scripts/test-api.ts
// Run with: npx tsx scripts/test-api.ts
// Run local: TEST_URL=http://localhost:3000 npx tsx scripts/test-api.ts

const BASE_URL = process.env.TEST_URL || 'https://meda-eritrea.vercel.app'

let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (err: any) {
    console.error(`❌ ${name}`)
    console.error(`   → ${err.message}`)
    failed++
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  const data = await res.json().catch(() => null)
  return { res, data }
}

// ─────────────────────────────────────────────────────────────
// SECTION: Public Pages (checks they don't 500)
// ─────────────────────────────────────────────────────────────
async function testPages() {
  console.log('\n📄 PUBLIC PAGES\n')

  const pages = [
    '/',
    '/browse',
    '/browse/beauty-wellness',
    '/login',
    '/register/client',   // ← fixed: /register doesn't exist, /register/client does
    '/forgot-password',
    '/privacy',
    '/terms',
  ]

  for (const page of pages) {
    await test(`Page ${page} loads (not 500)`, async () => {
      const res = await fetch(`${BASE_URL}${page}`)
      assert(res.status !== 500, `Got 500 on ${page}`)
      assert(res.status !== 404, `Got 404 on ${page}`)
    })
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION: Categories
// ─────────────────────────────────────────────────────────────
async function testCategories() {
  console.log('\n📂 CATEGORIES\n')

  let categories: any[] = []

  await test('GET /api/admin/categories → 200', async () => {
    const { res } = await fetchJSON('/api/admin/categories')
    assert(res.ok, `Status ${res.status}`)
  })

  await test('GET /api/admin/categories → returns array', async () => {
    const { data } = await fetchJSON('/api/admin/categories')
    assert(Array.isArray(data.categories), `Expected array, got ${typeof data.categories}`)
    categories = data.categories
    console.log(`   → ${categories.length} categories found`)
  })

  await test('Every category has id, name, slug, icon', async () => {
    for (const cat of categories) {
      assert(!!cat.id, `Missing id on "${cat.name}"`)
      assert(!!cat.name, `Missing name`)
      assert(!!cat.slug, `Missing slug on "${cat.name}"`)
      assert(!!cat.icon, `Missing icon on "${cat.name}"`)
    }
  })

  await test('Every category has subcategories array (never undefined)', async () => {
    for (const cat of categories) {
      assert(Array.isArray(cat.subcategories), `"${cat.name}" subcategories is ${typeof cat.subcategories}`)
    }
  })

  await test('beauty-wellness category exists with subcategories', async () => {
    const found = categories.find((c: any) => c.slug === 'beauty-wellness')
    assert(!!found, 'beauty-wellness not found')
    assert(Array.isArray(found.subcategories), 'No subcategories array')
    console.log(`   → subcategories: ${found.subcategories.map((s: any) => s.name).join(', ') || 'none'}`)
  })

  await test('POST /api/admin/categories without auth → 403', async () => {
    const { res } = await fetchJSON('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Category' }),
    })
    assert(res.status === 403, `Expected 403, got ${res.status}`)
  })

  await test('PATCH /api/admin/categories without auth → 403', async () => {
    const { res } = await fetchJSON('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'fake', name: 'Test' }),
    })
    assert(res.status === 403, `Expected 403, got ${res.status}`)
  })

  await test('DELETE /api/admin/categories without auth → 403', async () => {
    const { res } = await fetchJSON('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'fake' }),
    })
    assert(res.status === 403, `Expected 403, got ${res.status}`)
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Businesses
// ─────────────────────────────────────────────────────────────
async function testBusinesses() {
  console.log('\n🏢 BUSINESSES\n')

  await test('GET /api/businesses → 200', async () => {
    const { res } = await fetchJSON('/api/businesses')
    assert(res.ok, `Status ${res.status}`)
  })

  await test('GET /api/businesses → returns businesses array', async () => {
    const { data } = await fetchJSON('/api/businesses')
    assert(Array.isArray(data.businesses), `Expected array, got ${typeof data.businesses}`)
    console.log(`   → ${data.businesses.length} businesses found`)
  })

  await test('GET /api/businesses?category=beauty-wellness → array', async () => {
    const { data } = await fetchJSON('/api/businesses?category=beauty-wellness')
    assert(Array.isArray(data.businesses), `Expected array`)
    console.log(`   → ${data.businesses.length} beauty-wellness businesses`)
  })

  await test('GET /api/businesses?city=Toronto → array', async () => {
    const { data } = await fetchJSON('/api/businesses?city=Toronto')
    assert(Array.isArray(data.businesses), `Expected array`)
    console.log(`   → ${data.businesses.length} Toronto businesses`)
  })

  await test('GET /api/businesses?search=hair → array', async () => {
    const { data } = await fetchJSON('/api/businesses?search=hair')
    assert(Array.isArray(data.businesses), `Expected array`)
    console.log(`   → ${data.businesses.length} results for "hair"`)
  })

  await test('Each business has required fields', async () => {
    const { data } = await fetchJSON('/api/businesses')
    for (const biz of data.businesses ?? []) {
      assert(!!biz.id, `Missing id`)
      assert(!!biz.name, `Missing name on business ${biz.id}`)
      assert(!!biz.slug, `Missing slug on "${biz.name}"`)
      assert(!!biz.city, `Missing city on "${biz.name}"`)
    }
  })

  // Test a real business slug if any exist
  await test('GET /api/businesses/[slug] → valid business page', async () => {
    const { data } = await fetchJSON('/api/businesses')
    const first = data.businesses?.[0]
    if (!first) { console.log('   → skipped (no businesses)'); return }
    const res = await fetch(`${BASE_URL}/business/${first.slug}`)
    assert(res.status !== 500, `Got 500 on /business/${first.slug}`)
    console.log(`   → tested /business/${first.slug}`)
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Admin Routes (protected)
// ─────────────────────────────────────────────────────────────
async function testAdminRoutes() {
  console.log('\n🔐 ADMIN ROUTES (auth checks)\n')

  const adminRoutes = [
    '/api/admin/bookings',
    '/api/admin/businesses',
    '/api/admin/reviews',
    '/api/admin/stats',
    '/api/admin/users',
  ]

  for (const route of adminRoutes) {
    await test(`${route} without auth → 401 or 403`, async () => {
      const { res } = await fetchJSON(route)
      assert(
        res.status === 401 || res.status === 403,
        `Expected 401/403, got ${res.status}`
      )
    })
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION: Client & Business Registration
// ─────────────────────────────────────────────────────────────
async function testRegistration() {
  console.log('\n👤 REGISTRATION ENDPOINTS\n')

  await test('POST /api/client/create with missing fields → 400', async () => {
    const { res } = await fetchJSON('/api/client/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    assert(res.status === 400 || res.status === 422, `Expected 400/422, got ${res.status}`)
  })

  await test('POST /api/business/create with missing fields → 400', async () => {
    const { res } = await fetchJSON('/api/business/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    assert(res.status === 400 || res.status === 422, `Expected 400/422, got ${res.status}`)
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Bookings (protected)
// ─────────────────────────────────────────────────────────────
async function testBookings() {
  console.log('\n📅 BOOKINGS\n')

  await test('GET /api/bookings/my without auth → 401 or 403', async () => {
    const { res } = await fetchJSON('/api/bookings/my')
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`)
  })

  await test('POST /api/bookings/create without auth → 401 or 403', async () => {
    const { res } = await fetchJSON('/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'fake' }),
    })
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`)
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Reviews
// ─────────────────────────────────────────────────────────────
async function testReviews() {
  console.log('\n⭐ REVIEWS\n')

  await test('GET /api/reviews → 200 or 400 (not 500)', async () => {
    const { res } = await fetchJSON('/api/reviews')
    assert(res.status !== 500, `Got 500`)
  })

  await test('POST /api/reviews without auth → 401 or 403', async () => {
    const { res } = await fetchJSON('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'fake', rating: 5 }),
    })
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`)
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Notifications & Saved
// ─────────────────────────────────────────────────────────────
async function testProtectedMisc() {
  console.log('\n🔔 NOTIFICATIONS & SAVED\n')

  await test('GET /api/notifications without auth → 401 or 403', async () => {
    const { res } = await fetchJSON('/api/notifications')
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`)
  })

  await test('GET /api/saved without auth → 200 with saved:false (soft auth by design)', async () => {
    const { res, data } = await fetchJSON('/api/saved')
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    assert(data.saved === false, `Expected {saved:false}, got ${JSON.stringify(data)}`)
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Rate Limiting
// ─────────────────────────────────────────────────────────────
async function testRateLimiting() {
  console.log('\n🚦 RATE LIMITING\n')

  await test('Rapid POST /api/client/create → eventually 429', async () => {
    let got429 = false
    for (let i = 0; i < 15; i++) {
      const { res } = await fetchJSON('/api/client/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.status === 429) { got429 = true; break }
    }
    assert(got429, 'Rate limiter never triggered after 15 rapid requests')
    console.log('   → 429 triggered correctly')
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Security Headers
// ─────────────────────────────────────────────────────────────
async function testSecurityHeaders() {
  console.log('\n🛡️  SECURITY HEADERS\n')

  const res = await fetch(`${BASE_URL}/`)

  await test('Content-Security-Policy header is set', async () => {
    assert(!!res.headers.get('content-security-policy'), 'CSP header missing')
  })

  await test('X-Frame-Options is DENY', async () => {
    const val = res.headers.get('x-frame-options')
    assert(val === 'DENY', `Expected DENY, got ${val}`)
  })

  await test('X-Content-Type-Options is nosniff', async () => {
    const val = res.headers.get('x-content-type-options')
    assert(val === 'nosniff', `Expected nosniff, got ${val}`)
  })

  await test('Strict-Transport-Security is set', async () => {
    assert(!!res.headers.get('strict-transport-security'), 'HSTS header missing')
  })

  await test('X-Powered-By header is removed', async () => {
    const val = res.headers.get('x-powered-by')
    assert(!val, `x-powered-by should be removed, got "${val}"`)
  })
}

// ─────────────────────────────────────────────────────────────
// SECTION: Auth Callback
// ─────────────────────────────────────────────────────────────
async function testAuthCallback() {
  console.log('\n🔑 AUTH\n')

  await test('GET /auth/callback without code → redirect or 400 (not 500)', async () => {
    const res = await fetch(`${BASE_URL}/auth/callback`, { redirect: 'manual' })
    assert(res.status !== 500, `Got 500`)
    console.log(`   → status ${res.status}`)
  })
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`🧪  MEDA FULL API TEST SUITE`)
  console.log(`🌐  ${BASE_URL}`)
  console.log(`${'─'.repeat(50)}`)

  await testPages()
  await testCategories()
  await testBusinesses()
  await testAdminRoutes()
  await testRegistration()
  await testBookings()
  await testReviews()
  await testProtectedMisc()
  await testSecurityHeaders()
  await testAuthCallback()
  await testRateLimiting()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`📊  RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
  console.log(`${'─'.repeat(50)}\n`)

  if (failed > 0) process.exit(1)
}

run()