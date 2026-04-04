import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../utils/constants';

export default function LanguageSelector({ value, onChange }) {
  const [open, setOpen]      = useState(false);
  const ref                  = useRef(null);
  const selected             = LANGUAGES.find(l => l.id === value) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          minWidth: 140,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
      >
        <span>{selected.icon}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{selected.label}</span>
        <ChevronDown size={14} color="#64748B" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : '' }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            overflow: 'hidden',
            zIndex: 100,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              role="option"
              aria-selected={lang.id === value}
              onClick={() => { onChange(lang.id); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 12px',
                background: lang.id === value ? 'rgba(0,212,255,0.08)' : 'transparent',
                border: 'none',
                color: lang.id === value ? '#00D4FF' : 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (lang.id !== value) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (lang.id !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{lang.icon}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
