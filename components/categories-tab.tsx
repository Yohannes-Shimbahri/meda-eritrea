'use client'
import { useState, useEffect } from 'react'

type Subcategory = { id: string; name: string; slug: string; icon: string }
type Category = { id: string; name: string; icon: string; slug: string; subcategories?: Subcategory[] }
type Selection = { categoryId: string; subcategoryId: string; isPrimary: boolean; linkId?: string }

const CATEGORY_LIMITS: Record<string, number> = { FREE: 1, STANDARD: 3, PRO: Infinity }

export function CategoriesTab({
  getAuthHeaders,
  plan,
  onUpgrade,
}: {
  getAuthHeaders: () => Promise<Record<string, string>>
  plan: string
  onUpgrade: () => void
}) {
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [selections, setSelections] = useState<Selection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const maxCats = CATEGORY_LIMITS[plan] ?? 1
  const atLimit = selections.length >= maxCats

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  // Load all categories + current business selections
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Load all categories
        const catRes = await fetch('/api/admin/categories')
        const catData = await catRes.json()
        if (catData.categories) setAllCategories(catData.categories)

        // Load current business category selections
        const headers = await getAuthHeaders()
        const bizRes = await fetch('/api/business/categories', { headers })
        const bizData = await bizRes.json()
        if (bizData.selections?.length > 0) {
          setSelections(bizData.selections)
        } else {
          setSelections([{ categoryId: '', subcategoryId: '', isPrimary: true }])
        }
      } catch {
        setSelections([{ categoryId: '', subcategoryId: '', isPrimary: true }])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getSubsFor = (categoryId: string) =>
    allCategories.find(c => c.id === categoryId)?.subcategories || []

  const updateSelection = (index: number, field: 'categoryId' | 'subcategoryId', value: string) => {
    setSelections(prev => prev.map((s, i) => {
      if (i !== index) return s
      if (field === 'categoryId') return { ...s, categoryId: value, subcategoryId: '' }
      return { ...s, [field]: value }
    }))
  }

  const addSlot = () => {
    if (atLimit) { setShowUpgradeModal(true); return }
    setSelections(prev => [...prev, { categoryId: '', subcategoryId: '', isPrimary: false }])
  }

  const removeSlot = (index: number) => {
    if (selections.length === 1) return
    setSelections(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const valid = selections.filter(s => s.categoryId)
    if (valid.length === 0) { showMsg('Please select at least one category'); return }
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/business/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify({ selections: valid }),
      })
      const data = await res.json()
      if (data.success) showMsg('✓ Categories saved!')
      else showMsg(data.error || 'Failed to save')
    } catch { showMsg('Error saving') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '2rem' }}>Categories</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2].map(i => <div key={i} style={{ height: '80px', backgroundColor: '#111', borderRadius: '0.875rem', border: '1px solid #1a1a1a' }} />)}
      </div>
    </div>
  )

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #c9933a44', borderRadius: '1.25rem', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f5f0e8' }}>Upgrade to add more categories</h2>
            <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your <strong style={{ color: '#c9933a' }}>{plan}</strong> plan allows <strong style={{ color: '#f5f0e8' }}>{maxCats}</strong> {maxCats === 1 ? 'category' : 'categories'}.
            </p>
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '1.25rem', textAlign: 'left' }}>
              {[
                { plan: 'FREE', cats: '1 category', price: '$0/mo', color: '#888' },
                { plan: 'STANDARD', cats: '3 categories', price: '$19/mo', color: '#60a5fa' },
                { plan: 'PRO', cats: 'Unlimited', price: '$39/mo', color: '#c9933a' },
              ].map(p => (
                <div key={p.plan} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #222', fontSize: '0.82rem' }}>
                  <span style={{ color: p.color, fontWeight: '700' }}>{p.plan}</span>
                  <span style={{ color: '#888' }}>{p.cats}</span>
                  <span style={{ color: '#f5f0e8', fontWeight: '700' }}>{p.price}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowUpgradeModal(false)} style={{ flex: 1, background: 'none', border: '1px solid #333', color: '#888', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={() => { setShowUpgradeModal(false); onUpgrade() }} style={{ flex: 2, backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Upgrade Plan →</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>Categories</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Your business appears in all selected categories
            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', backgroundColor: '#1a1a1a', color: '#c9933a', padding: '0.15rem 0.5rem', borderRadius: '1rem', border: '1px solid #c9933a33' }}>
              {plan}: {maxCats === Infinity ? 'unlimited' : `${selections.length}/${maxCats}`}
            </span>
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ backgroundColor: saving ? '#7a5820' : '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
          {saving ? 'Saving...' : 'Save Categories'}
        </button>
      </div>

      {msg && (
        <div style={{ backgroundColor: msg.startsWith('✓') ? '#0a1f0a' : '#1f0a0a', border: `1px solid ${msg.startsWith('✓') ? '#4ade8044' : '#e05c5c44'}`, borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', color: msg.startsWith('✓') ? '#4ade80' : '#e05c5c', fontWeight: '600' }}>
          {msg}
        </div>
      )}

      {/* Plan limit info */}
      {plan !== 'PRO' && (
        <div style={{ backgroundColor: '#1a1200', border: '1px solid #c9933a33', borderRadius: '0.875rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#c9933a', fontSize: '0.88rem', marginBottom: '0.2rem' }}>
              {plan === 'FREE' ? '1 category on Free plan' : '3 categories on Standard plan'}
            </div>
            <div style={{ color: '#666', fontSize: '0.8rem' }}>
              {plan === 'FREE' ? 'Upgrade to Standard for 3 categories, or Pro for unlimited' : 'Upgrade to Pro for unlimited categories'}
            </div>
          </div>
          <button onClick={onUpgrade} style={{ backgroundColor: '#c9933a', color: '#0a0a0a', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.65rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            Upgrade →
          </button>
        </div>
      )}

      {/* Selections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {selections.map((sel, i) => {
          const subs = getSubsFor(sel.categoryId)
          const isPrimary = i === 0
          return (
            <div key={i} style={{ backgroundColor: '#111', border: `1px solid ${isPrimary ? '#c9933a44' : '#222'}`, borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isPrimary ? '#c9933a' : '#555' }}>
                  {isPrimary ? '★ Primary Category' : `Category ${i + 1}`}
                </span>
                {!isPrimary && (
                  <button onClick={() => removeSlot(i)} style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Remove</button>
                )}
              </div>

              {/* Parent category */}
              <select
                value={sel.categoryId}
                onChange={e => updateSelection(i, 'categoryId', e.target.value)}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: sel.categoryId ? '#f5f0e8' : '#666', fontSize: '0.9rem', outline: 'none', marginBottom: subs.length > 0 || sel.categoryId ? '0.6rem' : '0', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#c9933a'}
                onBlur={e => e.currentTarget.style.borderColor = '#333'}
              >
                <option value="">Select category...</option>
                {allCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>

              {/* Subcategory */}
              {sel.categoryId && (
                <select
                  value={sel.subcategoryId}
                  onChange={e => updateSelection(i, 'subcategoryId', e.target.value)}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: sel.subcategoryId ? '#f5f0e8' : '#666', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#c9933a'}
                  onBlur={e => e.currentTarget.style.borderColor = '#333'}
                >
                  <option value="">No subcategory (show in all of {allCategories.find(c => c.id === sel.categoryId)?.name})</option>
                  {subs.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              )}
            </div>
          )
        })}
      </div>

      {/* Add more */}
      <button onClick={addSlot}
        style={{ width: '100%', background: 'none', border: `1px dashed ${atLimit ? '#2a2a2a' : '#c9933a55'}`, color: atLimit ? '#444' : '#c9933a', padding: '0.75rem', borderRadius: '0.875rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
        {atLimit ? `🔒 Upgrade to add more (${plan} limit: ${maxCats})` : '+ Add another category'}
      </button>

      <p style={{ color: '#444', fontSize: '0.78rem', lineHeight: 1.5 }}>
        Your business will appear on all selected category browse pages. Clients searching any of these categories will find you.
      </p>
    </div>
  )
}