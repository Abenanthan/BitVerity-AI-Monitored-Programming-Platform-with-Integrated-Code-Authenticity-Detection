import { useContestTimer } from '../hooks/useContestTimer';

export default function ContestTimer({ endsAt }) {
  const { formatted, isLow, isWarning, isPulse } = useContestTimer(endsAt);

  const color =
    isLow     ? '#EF4444' :
    isWarning ? '#F59E0B' :
                '#F1F5F9';

  return (
    <span
      aria-live="polite"
      aria-label={`Time remaining: ${formatted}`}
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 20,
        fontWeight: 700,
        color,
        letterSpacing: '0.05em',
        animation: isPulse ? 'timerPulse 1s ease-in-out infinite' : undefined,
        textShadow: isLow ? `0 0 12px rgba(239,68,68,0.5)` : undefined,
      }}
    >
      {formatted}
    </span>
  );
}
