export default function AiDetectionBadge({ score = 0, compact = false }) {
  const color =
    score < 30 ? '#10B981' :
    score < 61 ? '#F59E0B' :
                 '#EF4444';

  const bg =
    score < 30 ? 'rgba(16,185,129,0.1)' :
    score < 61 ? 'rgba(245,158,11,0.1)' :
                 'rgba(239,68,68,0.1)';

  const border =
    score < 30 ? 'rgba(16,185,129,0.25)' :
    score < 61 ? 'rgba(245,158,11,0.25)' :
                 'rgba(239,68,68,0.25)';

  const label =
    score < 30 ? 'Human' :
    score < 61 ? 'Suspicious' :
                 'AI';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: compact ? '2px 8px' : '3px 10px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 4,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: compact ? 11 : 12,
      fontWeight: 600,
      color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}`,
      }} />
      {score}% {label}
    </span>
  );
}
