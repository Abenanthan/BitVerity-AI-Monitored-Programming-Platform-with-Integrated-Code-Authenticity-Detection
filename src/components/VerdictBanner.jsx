import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const VERDICTS = {
  accepted: {
    label:  'Accepted',
    icon:   CheckCircle,
    color:  '#10B981',
    bg:     'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    symbol: '✓',
  },
  wrong: {
    label:  'Wrong Answer',
    icon:   XCircle,
    color:  '#EF4444',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    symbol: '✗',
  },
  tle: {
    label:  'Time Limit Exceeded',
    icon:   Clock,
    color:  '#F59E0B',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    symbol: '⏱',
  },
  ce: {
    label:  'Compilation Error',
    icon:   AlertTriangle,
    color:  '#7C3AED',
    bg:     'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
    symbol: '!',
  },
  mle: {
    label:  'Memory Limit Exceeded',
    icon:   AlertTriangle,
    color:  '#F59E0B',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    symbol: '⚠',
  },
};

export default function VerdictBanner({ verdict = 'accepted', compact = false }) {
  const v = VERDICTS[verdict] || VERDICTS.wrong;
  const Icon = v.icon;

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        color: v.color,
        fontFamily: 'JetBrains Mono, monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {v.label}
      </span>
    );
  }

  return (
    <div style={{
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 10,
      padding: '28px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: `${v.color}20`,
        border: `2px solid ${v.color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={32} color={v.color} />
      </div>
      <div>
        <div style={{
          fontSize: 32,
          fontWeight: 800,
          color: v.color,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}>
          {v.symbol} {v.label}
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Your submission has been evaluated
        </div>
      </div>
    </div>
  );
}
