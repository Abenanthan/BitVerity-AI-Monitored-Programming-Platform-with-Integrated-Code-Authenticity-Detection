import { useEffect, useRef } from 'react';

export default function TrustScoreRing({ score = 78, size = 120, strokeWidth = 8 }) {
  const circleRef = useRef(null);
  const radius    = (size - strokeWidth) / 2;
  const circum    = 2 * Math.PI * radius;
  const offset    = circum - (score / 100) * circum;

  const color =
    score > 70 ? '#10B981' :
    score > 40 ? '#F59E0B' :
                 '#EF4444';

  const glowColor =
    score > 70 ? 'rgba(16,185,129,0.4)' :
    score > 40 ? 'rgba(245,158,11,0.4)' :
                 'rgba(239,68,68,0.4)';

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = circum.toString();
    requestAnimationFrame(() => {
      el.style.transition       = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
      el.style.strokeDashoffset = offset.toString();
    });
  }, [score, circum, offset]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circum}
            strokeDashoffset={circum}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: size > 100 ? 26 : 18,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}>
            {score}
          </span>
          <span style={{
            fontSize: 10,
            color: '#64748B',
            fontFamily: 'Inter, sans-serif',
            marginTop: 2,
          }}>
            / 100
          </span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
        Trust Score
      </span>
    </div>
  );
}
