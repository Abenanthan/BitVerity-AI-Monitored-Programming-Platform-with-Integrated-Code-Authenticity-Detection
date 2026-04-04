import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, Circle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DifficultyBadge from '../components/DifficultyBadge';
import { SAMPLE_PROBLEMS } from '../utils/constants';

const TOPICS = ['Array', 'String', 'Dynamic Programming', 'Tree', 'Graph', 'Binary Search', 'Stack', 'Linked List', 'Hash Table', 'Backtracking', 'Greedy', 'Heap', 'Trie', 'BFS', 'Two Pointers'];

export default function Problems() {
  const navigate = useNavigate();
  const [search, setSearch]         = useState('');
  const [diffFilter, setDiffFilter] = useState([]);
  const [topicFilter, setTopicFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]             = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);
  const PER_PAGE = 8;

  const filtered = SAMPLE_PROBLEMS.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q)) return false;
    if (diffFilter.length && !diffFilter.includes(p.difficulty)) return false;
    if (topicFilter.length && !p.topics.some(t => topicFilter.includes(t))) return false;
    if (statusFilter === 'solved' && p.status !== 'solved') return false;
    if (statusFilter === 'unsolved' && p.status) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleDiff(d) {
    setDiffFilter(f => f.includes(d) ? f.filter(x => x !== d) : [...f, d]);
    setPage(1);
  }
  function toggleTopic(t) {
    setTopicFilter(f => f.includes(t) ? f.filter(x => x !== t) : [...f, t]);
    setPage(1);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />

      <div style={{ marginLeft: 64, flex: 1, display: 'flex', minHeight: '100vh' }}>
        {/* Filter sidebar */}
        <aside style={{
          width: 220,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          padding: '24px 16px',
          position: 'sticky',
          top: 0, height: '100vh',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Filter size={14} color="#64748B" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filters</span>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Difficulty</div>
            {['Easy', 'Medium', 'Hard'].map(d => {
              const active = diffFilter.includes(d);
              const colors = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' };
              return (
                <button
                  key={d}
                  id={`diff-${d.toLowerCase()}`}
                  aria-pressed={active}
                  onClick={() => toggleDiff(d)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '7px 10px', marginBottom: 4,
                    background: active ? `${colors[d]}15` : 'transparent',
                    border: `1px solid ${active ? colors[d] + '40' : 'transparent'}`,
                    borderRadius: 6, cursor: 'pointer',
                    color: active ? colors[d] : '#64748B',
                    fontFamily: 'Inter, sans-serif', fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[d], flexShrink: 0 }} />
                  {d}
                </button>
              );
            })}
          </div>

          {/* Status */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</div>
            {[
              { id: 'all',      label: 'All Problems' },
              { id: 'solved',   label: 'Solved' },
              { id: 'unsolved', label: 'Not Solved' },
            ].map(s => (
              <button
                key={s.id}
                id={`status-${s.id}`}
                aria-pressed={statusFilter === s.id}
                onClick={() => { setStatusFilter(s.id); setPage(1); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', marginBottom: 4,
                  background: statusFilter === s.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                  border: `1px solid ${statusFilter === s.id ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
                  borderRadius: 6, cursor: 'pointer',
                  color: statusFilter === s.id ? '#00D4FF' : '#64748B',
                  fontFamily: 'Inter, sans-serif', fontSize: 13,
                  transition: 'all 0.15s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Topics */}
          <div>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Topics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {TOPICS.map(t => {
                const active = topicFilter.includes(t);
                return (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 10px', borderRadius: 6,
                    background: active ? 'rgba(124,58,237,0.1)' : 'transparent',
                    transition: 'background 0.1s',
                  }}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleTopic(t)}
                      style={{ accentColor: '#7C3AED', width: 12, height: 12, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: active ? '#A78BFA' : '#64748B' }}>{t}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main table */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }} className="page-enter">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Problems</h1>
              <p style={{ color: '#64748B', fontSize: 13 }}>{filtered.length} problems{diffFilter.length ? ` · filtered` : ''}</p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                id="problem-search"
                className="input-field"
                placeholder="Search problems..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: 36, fontSize: 13 }}
                aria-label="Search problems"
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table className="data-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 48 }} />
                <col />
                <col style={{ width: 100 }} />
                <col style={{ width: 110 }} />
                <col />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Acceptance</th>
                  <th>Topics</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onClick={() => navigate('/contest/weekly-42')}
                    onMouseEnter={() => setHoveredRow(p.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{p.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 500 }}>{p.title}</span>
                        {hoveredRow === p.id && (
                          <button
                            aria-label={`Solve ${p.title}`}
                            style={{
                              padding: '3px 12px', background: 'rgba(0,212,255,0.1)',
                              border: '1px solid rgba(0,212,255,0.25)',
                              borderRadius: 4, color: '#00D4FF',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Solve →
                          </button>
                        )}
                      </div>
                    </td>
                    <td><DifficultyBadge level={p.difficulty} /></td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#94A3B8' }}>
                      {p.acceptance}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.topics.slice(0, 2).map(t => (
                          <span key={t} style={{
                            fontSize: 10, padding: '2px 7px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 4, color: '#64748B',
                          }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {p.status === 'solved' ? (
                        <CheckCircle2 size={16} color="#10B981" aria-label="Solved" />
                      ) : p.status === 'attempted' ? (
                        <Circle size={16} color="#F59E0B" aria-label="Attempted" />
                      ) : (
                        <Circle size={16} color="#2D3748" aria-label="Not attempted" />
                      )}
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>No problems found</div>
                      <div style={{ fontSize: 12 }}>Try adjusting your filters</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-ghost"
                  style={{ padding: '6px 12px', opacity: page === 1 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    aria-label={`Page ${n}`}
                    aria-current={n === page ? 'page' : undefined}
                    onClick={() => setPage(n)}
                    style={{
                      width: 34, height: 34,
                      background: n === page ? 'rgba(0,212,255,0.15)' : 'transparent',
                      border: `1px solid ${n === page ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 6,
                      color: n === page ? '#00D4FF' : '#64748B',
                      fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer',
                    }}
                  >{n}</button>
                ))}
                <button
                  aria-label="Next page"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-ghost"
                  style={{ padding: '6px 12px', opacity: page === totalPages ? 0.4 : 1 }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
