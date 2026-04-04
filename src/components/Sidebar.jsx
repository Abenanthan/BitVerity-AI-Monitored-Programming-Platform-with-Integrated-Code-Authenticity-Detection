import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Code2, Trophy, BarChart2, User, Settings, LogOut, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,     label: 'Dashboard',   path: '/dashboard'  },
  { icon: Code2,    label: 'Problems',    path: '/problems'   },
  { icon: Trophy,   label: 'Contests',    path: '/contest/weekly-42' },
  { icon: BarChart2,label: 'Leaderboard', path: '/leaderboard'},
  { icon: User,     label: 'Profile',     path: '/profile'    },
  { icon: Settings, label: 'Settings',    path: '/settings'   },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: 64,
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: 4,
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <Zap size={20} color="#fff" />
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', alignItems: 'center' }}>
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            title={label}
            aria-label={label}
            className="tooltip-wrapper"
            style={({ isActive }) => ({
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
              color: isActive ? '#00D4FF' : '#64748B',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#F1F5F9';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748B';
              }
            }}
          >
            <Icon size={20} />
            <span className="tooltip">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Logout */}
      <button
        aria-label="Log out"
        title="Log out"
        onClick={() => navigate('/login')}
        className="tooltip-wrapper"
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid transparent',
          color: '#64748B',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
      >
        <LogOut size={20} />
        <span className="tooltip">Log out</span>
      </button>
    </aside>
  );
}
