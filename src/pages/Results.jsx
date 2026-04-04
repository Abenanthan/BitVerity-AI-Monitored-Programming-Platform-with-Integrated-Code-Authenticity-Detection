import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown,
  Clock, Cpu, Database, ChevronRight, CheckCircle, XCircle, Eye
} from 'lucide-react';
import VerdictBanner from '../components/VerdictBanner';
import AiDetectionBadge from '../components/AiDetectionBadge';
import TrustScoreRing from '../components/TrustScoreRing';
import { api } from '../utils/api';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const DETECTION_METRICS = [
  { key: 'behavioral',        label: 'Behavioral Analysis',   icon: '🧠' },
  { key: 'codePattern',      label: 'Code Pattern Analysis',  icon: '🔍' },
  { key: 'styleFingerprint', label: 'Style Fingerprinting',   icon: '✒️' },
  { key: 'explainability',   label: 'Explainability Score',   icon: '💡' },
];

export default function Results() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [animating, setAnimating]     = useState(false);
  const [showCode, setShowCode]       = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getResults(id);
        setResult(data);
        // Start animations after data loads
        setTimeout(() => setAnimating(true), 100);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', fontFamily: 'JetBrains Mono, monospace', color: '#64748B',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
          <div>Analyzing submission...</div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const ai = result.aiAnalysis;
  const isAiSuspected = ai.overallScore >= 60;
  const isClean       = ai.overallScore < 30;

  const overallColor =
    isClean       ? '#10B981' :
    isAiSuspected ? '#EF4444' :
                    '#F59E0B';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Top nav */}
      <header style={{
        height: 56,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
      }}>
        <button
          aria-label="Back to contest"
          onClick={() => navigate('/contest/weekly-42')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          ← Back to Contest
        </button>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Submission Result</span>
        <div style={{ flex: 1 }} />
        <AiDetectionBadge score={ai.overallScore} />
        <button
          aria-label="View all submissions"
          onClick={() => navigate('/problems')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, color: '#94A3B8',
            fontFamily: 'Inter, sans-serif', fontSize: 12,
            cursor: 'pointer',
          }}
        >
          All Submissions <ChevronRight size={12} />
        </button>
      </header>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px' }} className="page-enter">
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 24, alignItems: 'start' }}>

          {/* ======= LEFT COLUMN ======= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Verdict banner */}
            <VerdictBanner verdict={result.verdict} />

            {/* Submission details */}
            <div className="card">
              <h2 style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Submission Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { icon: Cpu,      label: 'Runtime',  value: result.runtime  },
                  { icon: Database, label: 'Memory',   value: result.memory   },
                  { icon: Clock,    label: 'Language', value: result.language },
                ].map(d => {
                  const Icon = d.icon;
                  return (
                    <div key={d.label} style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Icon size={13} color="#64748B" />
                        <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.label}</span>
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#00D4FF' }}>
                        {d.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Code viewer */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h2 style={{ fontSize: 13, fontWeight: 600 }}>Submitted Code</h2>
                <button
                  aria-label={showCode ? 'Hide code' : 'Show code'}
                  onClick={() => setShowCode(s => !s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4, color: '#94A3B8',
                    fontFamily: 'Inter, sans-serif', fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={12} /> {showCode ? 'Hide' : 'Show'} Code
                </button>
              </div>
              {showCode && (
                <div style={{ height: 260 }}>
                  <Suspense fallback={<div style={{ padding: 20, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>Loading...</div>}>
                    <MonacoEditor
                      height="260px"
                      language="python"
                      value={result.code}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, monospace',
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 12 },
                        renderLineHighlight: 'none',
                        overviewRulerBorder: false,
                      }}
                    />
                  </Suspense>
                </div>
              )}
            </div>

            {/* Test case results */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 13, fontWeight: 600 }}>Test Cases</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Input</th>
                    <th>Expected</th>
                    <th>Got</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.testCases.map((tc, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#64748B' }}>{i + 1}</td>
                      <td><code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94A3B8' }}>{tc.input}</code></td>
                      <td><code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#10B981' }}>{tc.expected}</code></td>
                      <td><code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: tc.passed ? '#10B981' : '#EF4444' }}>{tc.output}</code></td>
                      <td>
                        {tc.passed
                          ? <CheckCircle size={15} color="#10B981" aria-label="Passed" />
                          : <XCircle    size={15} color="#EF4444" aria-label="Failed" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======= RIGHT COLUMN — AI DETECTION ======= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>

            {/* AI Score card */}
            <div style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${overallColor}25`,
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${overallColor}20`,
                background: `${overallColor}08`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${overallColor}20`,
                  border: `1px solid ${overallColor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isAiSuspected
                    ? <AlertTriangle size={16} color={overallColor} />
                    : <Shield size={16} color={overallColor} />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>AI Detection Report</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Powered by CodeVerify Engine v2</div>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Big score ring */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                  <AiScoreRing score={ai.overallScore} animating={animating} />
                </div>

                {/* Metric breakdowns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  {DETECTION_METRICS.map(m => {
                    const val = ai[m.key] || 0;
                    const barColor =
                      val < 30 ? '#10B981' :
                      val < 61 ? '#F59E0B' :
                                 '#EF4444';
                    return (
                      <div key={m.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>
                            {m.icon} {m.label}
                          </span>
                          <span style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 12, fontWeight: 700, color: barColor,
                          }}>
                            {val}%
                          </span>
                        </div>
                        <div className="progress-bar-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: animating ? `${val}%` : '0%',
                              background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`,
                              boxShadow: `0 0 8px ${barColor}60`,
                              transition: animating ? 'width 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Flags */}
                {ai.flags && ai.flags.length > 0 ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Detected Events
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ai.flags.map((flag, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px',
                          background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.2)',
                          borderRadius: 6,
                        }}>
                          <AlertTriangle size={12} color="#F59E0B" />
                          <span style={{ fontSize: 12, color: '#CBD5E1', flex: 1 }}>{flag.message}</span>
                          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }}>t={flag.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px',
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 6,
                    }}>
                      <CheckCircle size={13} color="#10B981" />
                      <span style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>No suspicious events detected</span>
                    </div>
                  </div>
                )}

                {/* Verdict badge */}
                <div style={{
                  padding: '14px 16px',
                  background: isAiSuspected ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${isAiSuspected ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: isAiSuspected ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isAiSuspected
                      ? <AlertTriangle size={20} color="#EF4444" />
                      : <Shield size={20} color="#10B981" />
                    }
                  </div>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 800,
                      color: isAiSuspected ? '#EF4444' : '#10B981',
                      fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '0.05em',
                    }}>
                      {isAiSuspected ? '⚠ AI SUSPECTED' : '✓ HUMAN VERIFIED'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {isAiSuspected
                        ? 'This submission shows signs of AI generation'
                        : 'This submission appears to be human-authored'
                      }
                    </div>
                  </div>
                </div>

                {/* Trust score impact */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrustScoreRing score={78} size={44} strokeWidth={4} />
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Trust Score Impact</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Your new score: 80</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {result.trustScoreImpact > 0
                      ? <TrendingUp size={16} color="#10B981" />
                      : <TrendingDown size={16} color="#EF4444" />
                    }
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 20, fontWeight: 800,
                      color: result.trustScoreImpact > 0 ? '#10B981' : '#EF4444',
                    }}>
                      {result.trustScoreImpact > 0 ? '+' : ''}{result.trustScoreImpact}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('/contest/weekly-42')}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
                aria-label="Try again"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/problems')}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                aria-label="Next problem"
              >
                Next Problem →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom circular AI score ring for results page
function AiScoreRing({ score, animating }) {
  const size   = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (score / 100) * circum;

  const color =
    score < 30 ? '#10B981' :
    score < 61 ? '#F59E0B' :
                 '#EF4444';

  const label =
    score < 30 ? 'Low Risk' :
    score < 61 ? 'Suspicious' :
                 'High Risk';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circum}
            strokeDashoffset={animating ? offset : circum}
            style={{
              transition: animating ? 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' : 'none',
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
            {score}%
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>AI Probability</div>
        </div>
      </div>
      <span style={{
        padding: '3px 12px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: 4, fontSize: 11, fontWeight: 700,
        color, fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.05em',
      }}>
        {label}
      </span>
    </div>
  );
}
