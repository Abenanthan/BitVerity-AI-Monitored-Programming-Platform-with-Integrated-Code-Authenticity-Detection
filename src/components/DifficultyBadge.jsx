import { DIFFICULTY_LEVELS } from '../utils/constants';

export default function DifficultyBadge({ level = 'Medium' }) {
  const style = DIFFICULTY_LEVELS[level] || DIFFICULTY_LEVELS.Medium;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      color: style.color,
      fontFamily: 'Inter, sans-serif',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {level}
    </span>
  );
}
