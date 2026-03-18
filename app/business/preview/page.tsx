'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function BusinessPreviewPage() {
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/business/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()

      if (data.business?.slug) {
        window.location.href = `/business/${data.business.slug}`
      } else {
        window.location.href = '/business/dashboard'
      }
    }
    load()
  }, [])

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.9rem' }}>
      Loading preview...
    </div>
  )
}