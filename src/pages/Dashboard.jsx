import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Search, CheckCircle2, Flame, Trophy, AlertTriangle,
  ArrowRight, Clock, Users, Code2, ChevronRight, TrendingUp
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TrustScoreRing from '../components/TrustScoreRing';
import AiDetectionBadge from '../components/AiDetectionBadge';
import DifficultyBadge from '../components/DifficultyBadge';
import VerdictBanner from '../components/VerdictBanner';
import ContestTimer from '../components/ContestTimer';
import { api } from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardData, userData] = await Promise.all([
          api.getDashboardData(),
          api.getMe()
        ]);
        setData(dashboardData);
        setUser(userData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#0D0D12', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
        <div className="pulse" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>INITIALIZING DASHBOARD...</div>
      </div>
    );
  }

  const { stats, recentSubmissions, activeContests, recommendedProblems } = data;

  const STAT_CARDS = [
    { label: 'Problems Solved', value: stats.problemsSolved, icon: CheckCircle2, color: '#10B981' },
    { label: 'Contests Won', value: stats.contestsWon, icon: Trophy, color: '#F59E0B' },
    { label: 'Current Streak', value: stats.currentStreak + 'd', icon: Flame, color: '#EF4444' },
    { label: 'AI Flags', value: stats.aiFlags, icon: AlertTriangle, color: '#64748B' },
  ];

  const firstName = user?.username || 'Developer';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />

      {/* Main area */}
      <div style={{ marginLeft: 64, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{
          height: 60,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16,
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              id="dashboard-search"
              placeholder="Search problems... ⌘K"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 36, fontSize: 13 }}
              aria-label="Search problems"
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Notifications */}
          <button aria-label="Notifications" style={{
            position: 'relative', background: 'none', border: 'none',
            color: '#64748B', cursor: 'pointer', padding: 8,
          }}>
            <Bell size={18} />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: '#EF4444', border: '1.5px solid var(--bg-surface)',
            }} />
          </button>

          {/* User avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
              {firstName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{firstName}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>@{user?.username}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px 28px', overflowY: 'auto' }} className="page-enter">
          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Welcome back, {firstName} 👋</h1>
            <p style={{ color: '#64748B', fontSize: 13 }}>Here's your coding activity at a glance.</p>
          </div>

          {/* Top grid: Trust score + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, marginBottom: 24 }}>
            {/* Trust score card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <TrustScoreRing score={stats.trustScore} size={130} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                  <TrendingUp size={12} style={{ display: 'inline', marginRight: 4, color: '#10B981' }} />
                  Verified Status
                </div>
                <div style={{
                  fontSize: 11, padding: '3px 10px',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 4, color: '#10B981', fontFamily: 'JetBrains Mono, monospace',
                  display: 'inline-block',
                }}>
                  {stats.trustScore >= 80 ? 'EXPERT DEVELOPER' : 'VERIFIED DEVELOPER'}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {STAT_CARDS.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${s.color}15`,
                      border: `1px solid ${s.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: s.color }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle row: submissions + active contests */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
            {/* Submissions table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Recent Submissions</h2>
                <Link to="/problems" style={{ fontSize: 12, color: '#00D4FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Language</th>
                    <th>Verdict</th>
                    <th>AI Score</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map(sub => (
                    <tr key={sub.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/results/${sub.id}`)}>
                      <td style={{ fontWeight: 500 }}>{sub.problem.title}</td>
                      <td>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11, color: '#94A3B8',
                          background: 'rgba(255,255,255,0.04)',
                          padding: '2px 8px', borderRadius: 4,
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>{sub.language}</span>
                      </td>
                      <td><VerdictBanner verdict={sub.verdict} compact /></td>
                      <td><AiDetectionBadge score={sub.aiScore} compact /></td>
                      <td style={{ color: '#64748B', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {recentSubmissions.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', py: 20, color: '#64748B', fontSize: 13 }}>No submissions yet. Start coding!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Active contests */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>Active Contests</h2>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#10B981', display: 'inline-block',
                  boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                  animation: 'timerPulse 2s ease-in-out infinite',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activeContests.map(contest => (
                  <div
                    key={contest.id}
                    onClick={() => navigate(`/contest/${contest.id}`)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{contest.title}</div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748B' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Code2 size={10} /> {contest.problemCount} problems
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={10} /> {contest.participantCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <ContestTimer endsAt={contest.endTime} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> Ends in
                      </span>
                      <button
                        aria-label={`Join ${contest.title}`}
                        onClick={e => { e.stopPropagation(); navigate(`/contest/${contest.id}`); }}
                        className="btn-primary"
                        style={{ fontSize: 11, padding: '5px 14px' }}
                      >
                        Join <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {activeContests.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 13 }}>No active contests right now.</div>
                )}
              </div>
            </div>
          </div>

          {/* Recommended problems */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600 }}>Recommended Problems</h2>
              <Link to="/problems" style={{ fontSize: 12, color: '#00D4FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
              {recommendedProblems.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/problem/${p.slug}`)}
                  style={{
                    padding: '16px 20px',
                    borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>#{p.slug.substring(0, 4)}</span>
                    <DifficultyBadge level={p.difficulty} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{p.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.topics.map(t => (
                      <span key={t} style={{
                        fontSize: 10, padding: '2px 8px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 4, color: '#64748B',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
              {recommendedProblems.length === 0 && (
                <div style={{ gridColumn: 'span 3', padding: 20, textAlign: 'center', color: '#64748B', fontSize: 13 }}>No recommendations at the moment.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
