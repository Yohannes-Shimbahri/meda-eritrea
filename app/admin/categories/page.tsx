'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  isActive: boolean
  order: number
  _count?: { businesses: number }
}

const POPULAR_ICONS = ['✂️','💇','💄','💈','🍽️','🎥','🎨','🚗','🍰','🔧','💅','🧴','👗','🎭','🎪','🏋️','🍕','🛁','🌸','🎶','📸','🏠','🪴','🐾','⚽','🎓','💼','🩺','✈️','🎁']

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', icon: '🏢', description: '', order: '0' })

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` }
  }

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = async () => {
    setLoading(true)
    const headers = await getHeaders()
    const res = await fetch('/api/admin/categories', { headers })
    const data = await res.json()
    if (data.categories) setCategories(data.categories)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ name: '', icon: '🏢', description: '', order: '0' }); setEditingId(null); setShowForm(false) }

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, icon: cat.icon, description: cat.description || '', order: String(cat.order) })
    setEditingId(cat.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showMsg('Name is required'); return }
    setSaving(true)
    try {
      const headers = await getHeaders()
      const body = { ...form, order: Number(form.order), ...(editingId ? { id: editingId } : {}) }
      const res = await fetch('/api/admin/categories', {
        method: editingId ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) { showMsg(editingId ? '✓ Category updated!' : '✓ Category created!'); resetForm(); load() }
      else showMsg(data.error || 'Failed')
    } catch { showMsg('Error saving') }
    finally { setSaving(false) }
  }

  const handleToggle = async (cat: Category) => {
    const headers = await getHeaders()
    const res = await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
    })
    const data = await res.json()
    if (data.success) { showMsg(`✓ ${cat.name} ${!cat.isActive ? 'enabled' : 'disabled'}`); load() }
    else showMsg(data.error || 'Failed')
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
    const headers = await getHeaders()
    const res = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ id: cat.id }),
    })
    const data = await res.json()
    if (data.success) { showMsg('✓ Deleted'); load() }
    else showMsg(data.error || 'Cannot delete')
  }

  const s = {
    page: { backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f0e8', padding: '2rem', fontFamily: 'system-ui, sans-serif' },
    card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' },
    input: { width: '100%', background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f5f0e8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: '0.8rem', fontWeight: '600' as const, color: '#888', marginBottom: '0.4rem' },
    btn: (color = '#c9933a') => ({ backgroundColor: color, color: color === '#333' ? '#888' : '#0a0a0a', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '0.75rem', fontWeight: '700' as const, cursor: 'pointer', fontSize: '0.9rem' }),
  }

  return (
    <div style={s.page}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>Categories</h1>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>{categories.length} categories · manage what service types appear on Meda</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true) }} style={s.btn()}>+ New Category</button>
        </div>

        {msg && (
          <div style={{ backgroundColor: msg.startsWith('✓') ? '#0a1f0a' : '#1f0a0a', border: `1px solid ${msg.startsWith('✓') ? '#4ade8044' : '#e05c5c44'}`, borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', color: msg.startsWith('✓') ? '#4ade80' : '#e05c5c', fontWeight: '600' }}>
            {msg}
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <div style={s.card}>
            <h2 style={{ fontWeight: '700', marginBottom: '1.25rem', fontSize: '1rem' }}>
              {editingId ? '✏️ Edit Category' : '➕ New Category'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={s.label}>Category Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Nail Salon" style={s.input} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
              </div>
              <div>
                <label style={s.label}>Sort Order</label>
                <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))} style={s.input} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={s.label}>Description (optional)</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description shown to users" style={s.input} onFocus={e => (e.currentTarget.style.borderColor = '#c9933a')} onBlur={e => (e.currentTarget.style.borderColor = '#333')} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={s.label}>Icon — selected: <span style={{ fontSize: '1.2rem' }}>{form.icon}</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {POPULAR_ICONS.map(icon => (
                  <button key={icon} onClick={() => setForm(p => ({ ...p, icon }))} style={{ fontSize: '1.4rem', background: form.icon === icon ? '#1a1200' : 'transparent', border: `2px solid ${form.icon === icon ? '#c9933a' : '#333'}`, borderRadius: '0.5rem', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                  </button>
                ))}
                <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="or type any emoji" style={{ ...s.input, width: '140px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleSave} disabled={saving} style={s.btn()}>{saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}</button>
              <button onClick={resetForm} style={s.btn('#333')}>Cancel</button>
            </div>
          </div>
        )}

        {/* Category List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗂️</div>
            <p style={{ color: '#888' }}>No categories yet. Create your first one above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.sort((a, b) => a.order - b.order).map(cat => (
              <div key={cat.id} style={{ backgroundColor: '#111', border: `1px solid ${cat.isActive ? '#222' : '#1a1200'}`, borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: cat.isActive ? 1 : 0.6 }}>
                <div style={{ fontSize: '2rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', borderRadius: '0.75rem', flexShrink: 0 }}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem' }}>{cat.name}</span>
                    {!cat.isActive && <span style={{ fontSize: '0.7rem', backgroundColor: '#333', color: '#888', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: '700' }}>HIDDEN</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>
                    /{cat.slug} · {cat._count?.businesses ?? 0} businesses · order {cat.order}
                  </div>
                  {cat.description && <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>{cat.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => handleEdit(cat)} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                  <button onClick={() => handleToggle(cat)} style={{ background: 'none', border: `1px solid ${cat.isActive ? '#333' : '#c9933a44'}`, color: cat.isActive ? '#888' : '#c9933a', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                    {cat.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleDelete(cat)} style={{ background: 'none', border: '1px solid #e05c5c33', color: '#e05c5c', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }} disabled={(cat._count?.businesses ?? 0) > 0} title={(cat._count?.businesses ?? 0) > 0 ? 'Cannot delete — businesses use this category' : 'Delete'}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}