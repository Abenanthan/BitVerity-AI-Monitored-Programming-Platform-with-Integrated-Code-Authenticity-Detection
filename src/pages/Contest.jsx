import { useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, RotateCcw, Copy, Maximize2, Minus, Plus,
  Play, Send, AlertTriangle, Check, Terminal
} from 'lucide-react';
import DifficultyBadge from '../components/DifficultyBadge';
import ContestTimer from '../components/ContestTimer';
import LanguageSelector from '../components/LanguageSelector';
import BehaviorMonitor from '../components/BehaviorMonitor';
import VerdictBanner from '../components/VerdictBanner';
import { STARTER_CODE, ACTIVE_CONTESTS } from '../utils/constants';
import { api } from '../utils/api';
import { useSocket } from '../hooks/useSocket';

// Lazy-load Monaco
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const PROBLEM = {
  title: 'Two Sum',
  difficulty: 'Easy',
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
  inputFormat: 'First line: array of integers `nums`. Second line: integer `target`.',
  outputFormat: 'Return two indices as an array.',
  constraints: [
    '2 ≤ nums.length ≤ 10⁴',
    '-10⁹ ≤ nums[i] ≤ 10⁹',
    '-10⁹ ≤ target ≤ 10⁹',
    'Only one valid answer exists.',
  ],
  examples: [
    { input: 'nums = [2,7,11,15]\ntarget = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
    { input: 'nums = [3,2,4]\ntarget = 6',      output: '[1,2]', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
  ],
};

const PROBLEMS_NAV = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', solved: true },
  { id: 2, title: 'Longest Palindrome', difficulty: 'Medium', solved: false },
  { id: 3, title: 'Merge Intervals', difficulty: 'Medium', solved: false },
  { id: 4, title: 'Trapping Rain Water', difficulty: 'Hard', solved: false },
];

export default function Contest() {
  const { id }   = useParams();
  const navigate = useNavigate();

  // Editor state
  const [lang, setLang]         = useState('python');
  const [code, setCode]         = useState(STARTER_CODE.python);
  const [fontSize, setFontSize] = useState(14);
  const [customInput, setCustomInput] = useState('[2,7,11,15]\n9');
  const [output, setOutput]     = useState('');
  const [verdict, setVerdict]   = useState(null);
  const [running, setRunning]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [openExamples, setOpenExamples] = useState([0]);

  // Behavior monitor
  const [behaviorState, setBehaviorState] = useState({ events: [], hasWarning: false });
  const [pasteFlash, setPasteFlash]       = useState(false);
  const editorWrapperRef = useRef(null);

  // Line/col tracking
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const contest = ACTIVE_CONTESTS.find(c => c.id === id) || ACTIVE_CONTESTS[0];

  // Mock socket
  useSocket(id, (event) => {
    if (event.type === 'contest_announcement') {
      setOutput(prev => prev + `\n[CONTEST] ${event.data.message}`);
    }
  });

  function handleLangChange(newLang) {
    setLang(newLang);
    setCode(STARTER_CODE[newLang] || '');
    setVerdict(null);
    setOutput('');
  }

  function handleReset() {
    setCode(STARTER_CODE[lang] || '');
    setVerdict(null);
    setOutput('');
  }

  async function handleRun() {
    setRunning(true);
    setVerdict(null);
    setOutput('Running...');
    await new Promise(r => setTimeout(r, 1200));
    setOutput(`Input:\n${customInput}\n\nOutput:\n[0, 1]\n\nExpected:\n[0, 1]\n\n✓ All test cases passed`);
    setRunning(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setVerdict(null);
    setOutput('Judging submission...');
    try {
      const result = await api.submitCode(id, 1, code, lang);
      setVerdict(result.verdict);
      setOutput(
        result.verdict === 'accepted'
          ? `✓ Accepted\nRuntime: ${result.runtime}\nMemory: ${result.memory}\n\nAll test cases passed!`
          : result.verdict === 'tle'
          ? `⏱ Time Limit Exceeded\nRuntime: > 2000ms`
          : `✗ Wrong Answer\nTest #2 failed.\n\nInput: [3,2,4], target=6\nExpected: [1,2]\nGot: [0,2]`
      );
      if (result.verdict === 'accepted') {
        setTimeout(() => navigate(`/results/sub-${Date.now()}`), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const handleBehaviorUpdate = useCallback((state) => {
    setBehaviorState(state);
  }, []);

  function handleEditorPaste() {
    behaviorState.registerPaste?.();
    setPasteFlash(true);
    setTimeout(() => setPasteFlash(false), 600);
  }

  function toggleExample(i) {
    setOpenExamples(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

  const verdictColor = verdict === 'accepted' ? '#10B981' : verdict === 'tle' ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      <BehaviorMonitor onUpdate={handleBehaviorUpdate} />

      {/* ---- TOP BAR ---- */}
      <header style={{
        height: 48, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 16, flexShrink: 0,
      }}>
        {/* Logo + contest name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            aria-label="Back to dashboard"
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}
          >
            ←
          </button>
          <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{contest.name}</span>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>|</span>
          <DifficultyBadge level={PROBLEM.difficulty} />
        </div>

        <div style={{ flex: 1 }} />

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>Ends in</span>
          <ContestTimer endsAt={contest.endsAt} />
        </div>

        <div style={{ flex: 1 }} />

        {/* Problem tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {PROBLEMS_NAV.map((p, i) => (
            <button
              key={p.id}
              aria-label={`Problem ${i + 1}: ${p.title}`}
              aria-pressed={activeTab === i}
              onClick={() => setActiveTab(i)}
              style={{
                width: 32, height: 28,
                background: activeTab === i ? 'rgba(0,212,255,0.15)' : 'transparent',
                border: `1px solid ${activeTab === i ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 6,
                color: p.solved ? '#10B981' : activeTab === i ? '#00D4FF' : '#64748B',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </header>

      {/* ---- 3 PANELS ---- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT PANEL — Problem statement */}
        <div style={{
          width: leftOpen ? '30%' : 0,
          minWidth: leftOpen ? 280 : 0,
          maxWidth: leftOpen ? 420 : 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px' }}>
            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>{PROBLEM.title}</h1>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <DifficultyBadge level={PROBLEM.difficulty} />
                <span style={{
                  fontSize: 11, padding: '2px 8px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 4, color: '#10B981',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  Acceptance: 67.2%
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#CBD5E1', marginBottom: 24 }}>
              <ProblemText text={PROBLEM.description} />
            </div>

            {/* Examples */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Examples
              </div>
              {PROBLEM.examples.map((ex, i) => (
                <div key={i} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8, marginBottom: 8, overflow: 'hidden',
                }}>
                  <button
                    aria-expanded={openExamples.includes(i)}
                    onClick={() => toggleExample(i)}
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: 'var(--bg-elevated)', border: 'none',
                      color: '#94A3B8', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Example {i + 1}
                    {openExamples.includes(i) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {openExamples.includes(i) && (
                    <div style={{ padding: '12px 14px', background: 'var(--bg-base)' }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Input</span>
                        <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#00D4FF', marginTop: 4, margin: '4px 0 0' }}>{ex.input}</pre>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Output</span>
                        <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#10B981', marginTop: 4, margin: '4px 0 0' }}>{ex.output}</pre>
                      </div>
                      {ex.explanation && (
                        <div>
                          <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Explanation</span>
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{ex.explanation}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Constraints
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PROBLEM.constraints.map((c, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#7C3AED', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, marginTop: 3 }}>►</span>
                    <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#CBD5E1' }}>{c}</code>
                  </li>
                ))}
              </ul>
            </div>

            {/* Input/Output Format */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Input Format
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7 }}>{PROBLEM.inputFormat}</p>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Output Format
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7 }}>{PROBLEM.outputFormat}</p>
            </div>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          aria-label={leftOpen ? 'Collapse problem panel' : 'Expand problem panel'}
          onClick={() => setLeftOpen(o => !o)}
          style={{
            width: 16, background: 'var(--bg-elevated)',
            border: 'none', borderRight: '1px solid var(--border)',
            cursor: 'pointer', color: '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#00D4FF'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
        >
          {leftOpen ? '‹' : '›'}
        </button>

        {/* CENTER PANEL — Monaco Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Editor toolbar */}
          <div style={{
            height: 44, background: '#0a0a10',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center',
            padding: '0 12px', gap: 12, flexShrink: 0,
          }}>
            <LanguageSelector value={lang} onChange={handleLangChange} />

            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />

            {/* Font size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button aria-label="Decrease font size" onClick={() => setFontSize(f => Math.max(10, f - 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 2 }}>
                <Minus size={12} />
              </button>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94A3B8', minWidth: 20, textAlign: 'center' }}>
                {fontSize}
              </span>
              <button aria-label="Increase font size" onClick={() => setFontSize(f => Math.min(24, f + 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 2 }}>
                <Plus size={12} />
              </button>
            </div>

            <div style={{ flex: 1 }} />

            {/* Reset */}
            <button
              aria-label="Reset code"
              onClick={handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', fontSize: 12, padding: '4px 8px',
                borderRadius: 4, transition: 'color 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
            >
              <RotateCcw size={13} /> Reset
            </button>

            {/* Copy */}
            <button
              aria-label="Copy code"
              onClick={() => navigator.clipboard.writeText(code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', fontSize: 12, padding: '4px 8px',
                borderRadius: 4, transition: 'color 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
            >
              <Copy size={13} /> Copy
            </button>

            <button aria-label="Fullscreen" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B', padding: 4,
            }}>
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Monaco Editor */}
          <div
            ref={editorWrapperRef}
            onPaste={handleEditorPaste}
            style={{
              flex: 1,
              outline: pasteFlash ? '2px solid rgba(245,158,11,0.5)' : 'none',
              transition: pasteFlash ? 'none' : 'outline 0.6s ease',
            }}
          >
            <Suspense fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                Loading editor...
              </div>
            }>
              <MonacoEditor
                height="100%"
                language={lang === 'cpp' ? 'cpp' : lang}
                value={code}
                onChange={(val) => setCode(val || '')}
                theme="vs-dark"
                options={{
                  fontSize,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontLigatures: true,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: 'all',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  folding: true,
                  tabSize: 4,
                  wordWrap: 'off',
                  scrollbar: { vertical: 'auto', horizontal: 'auto' },
                }}
                onMount={(editor) => {
                  editor.onDidChangeCursorPosition(e => {
                    setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                  });
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* RIGHT PANEL — Controls */}
        <div style={{
          width: '22%', minWidth: 220, maxWidth: 320,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Action buttons */}
          <div style={{ padding: '14px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              id="run-code-btn"
              aria-label="Run code"
              onClick={handleRun}
              disabled={running || submitting}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '9px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, color: '#F1F5F9',
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                cursor: running ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!running) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              {running
                ? <><Spinner /> Running...</>
                : <><Play size={14} /> Run Code</>
              }
            </button>

            <button
              id="submit-btn"
              aria-label="Submit solution"
              onClick={handleSubmit}
              disabled={running || submitting}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '9px',
                background: submitting ? 'rgba(0,212,255,0.4)' : 'linear-gradient(135deg, #00D4FF, #0099CC)',
                border: 'none',
                borderRadius: 6,
                color: '#0D0D12',
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.boxShadow = '0 0 16px rgba(0,212,255,0.3)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {submitting
                ? <><Spinner dark /> Judging...</>
                : verdict === 'accepted'
                ? <><Check size={14} /> Accepted!</>
                : <><Send size={14} /> Submit</>
              }
            </button>

            {/* Verdict display */}
            {verdict && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <VerdictBanner verdict={verdict} compact />
              </div>
            )}
          </div>

          {/* Custom test input */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
            <label htmlFor="custom-input" style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
              Custom Input
            </label>
            <textarea
              id="custom-input"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              rows={4}
              className="input-field"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12, resize: 'vertical',
                background: 'var(--bg-base)',
              }}
              placeholder="Enter test input..."
              aria-label="Custom test input"
            />
          </div>

          {/* Output console */}
          <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={12} color="#64748B" />
              <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Output</span>
              {verdict && (
                <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: verdictColor, boxShadow: `0 0 6px ${verdictColor}` }} />
              )}
            </div>
            <pre style={{
              flex: 1,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              lineHeight: 1.7,
              color: verdict === 'accepted' ? '#10B981' : verdict ? '#EF4444' : '#94A3B8',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '10px 12px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {output || <span style={{ color: '#2D3748' }}>// Run or submit to see output</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* ---- STATUS BAR ---- */}
      <div className="status-bar" style={{ flexShrink: 0 }}>
        <span style={{
          color: lang === 'python' ? '#F59E0B' : lang === 'cpp' ? '#00D4FF' : lang === 'java' ? '#F59E0B' : '#10B981',
          fontWeight: 600,
        }}>
          {lang.toUpperCase()}
        </span>
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span>Spaces: 4</span>
        <span>UTF-8</span>
        <div style={{ flex: 1 }} />
        {behaviorState.hasWarning && (
          <div
            className="behavior-dot"
            title={`${behaviorState.events.length} behavior event(s) detected`}
            style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }} />
            <span style={{ color: '#F59E0B', fontSize: 11 }}>
              <AlertTriangle size={10} style={{ display: 'inline' }} /> {behaviorState.events.length} behavior event{behaviorState.events.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        <span style={{ color: '#10B981' }}>● Connected</span>
      </div>
    </div>
  );
}

function Spinner({ dark }) {
  return (
    <span style={{
      width: 13, height: 13,
      border: `2px solid ${dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)'}`,
      borderTopColor: dark ? '#0D0D12' : '#F1F5F9',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  );
}

function ProblemText({ text }) {
  // Render markdown-like bold and code inline
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: '#F1F5F9' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#00D4FF', background: 'rgba(0,212,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
