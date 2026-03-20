'use client'
import { useLanguage, LANGUAGES, Language } from '@/lib/i18n'
import { useState } from 'react'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: '#111', border: '1px solid #333', borderRadius: '0.65rem',
          padding: '0.4rem 0.75rem', cursor: 'pointer', color: '#f5f0e8',
          fontSize: '0.82rem', fontWeight: '700', transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9933a')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = open ? '#c9933a' : '#333')}
      >
        <span>{current.flag}</span>
        <span style={{ color: '#c9933a' }}>{current.label}</span>
        <span style={{ color: '#555', fontSize: '0.65rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
          backgroundColor: '#111', border: '1px solid #333', borderRadius: '0.75rem',
          overflow: 'hidden', zIndex: 500, minWidth: '120px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code as Language); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                width: '100%', padding: '0.65rem 1rem', background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                color: language === lang.code ? '#c9933a' : '#888',
                fontSize: '0.85rem', fontWeight: language === lang.code ? '700' : '400',
                backgroundColor: language === lang.code ? '#1a1200' : 'transparent',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { if (language !== lang.code) e.currentTarget.style.backgroundColor = '#1a1a1a' }}
              onMouseLeave={e => { if (language !== lang.code) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {language === lang.code && <span style={{ marginLeft: 'auto', color: '#c9933a' }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 499 }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}