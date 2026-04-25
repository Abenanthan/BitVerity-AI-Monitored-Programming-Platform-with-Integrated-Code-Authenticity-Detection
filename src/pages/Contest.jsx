import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, RotateCcw, Copy, Maximize2, Minus, Plus,
  Play, Send, AlertTriangle, Check, Terminal
} from 'lucide-react';
import DifficultyBadge from '../components/DifficultyBadge';
import ContestTimer from '../components/ContestTimer';
import LanguageSelector from '../components/LanguageSelector';
import VerdictBanner from '../components/VerdictBanner';
import { STARTER_CODE, ACTIVE_CONTESTS } from '../utils/constants';
import { api } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useBehaviorTracker } from '../hooks/useBehaviorTracker';
import React, { memo } from 'react';

// ── Real code execution via Wandbox ──────────────────────────────
async function runWandbox(code, language, stdin) {
  const compilers = { python: 'cpython-3.10.15', javascript: 'nodejs-20.10.0', cpp: 'gcc-head', java: 'openjdk-head' };
  const compiler = compilers[language] || 'cpython-3.10.15';
  try {
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code, stdin: stdin || '', save: false }),
    });
    if (!res.ok) return { out: '', err: `API Error ${res.status}`, exitCode: 1 };
    const d = await res.json();
    return {
      out: d.program_output || '',
      err: (d.compiler_error || '') + (d.program_error || ''),
      exitCode: d.status === '0' ? 0 : 1,
    };
  } catch (e) {
    return { out: '', err: `Network error: ${e.message}`, exitCode: 1 };
  }
}

// Lazy-load Monaco
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const PROBLEMS_NAV = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', solved: true },
  { id: 2, title: 'Longest Palindrome', difficulty: 'Medium', solved: false },
  { id: 3, title: 'Merge Intervals', difficulty: 'Medium', solved: false },
  { id: 4, title: 'Trapping Rain Water', difficulty: 'Hard', solved: false },
];

export default function Contest() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const [problemData, setProblemData] = useState(null);

  // Editor state
  const [lang, setLang]         = useState('python');
  const [code, setCode]         = useState(STARTER_CODE.python);
  const [fontSize, setFontSize] = useState(14);
  const [customInput, setCustomInput] = useState('2 7 11 15\n9');
  const [output, setOutput]     = useState('');
  const [verdict, setVerdict]   = useState(null);
  const [running, setRunning]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leftOpen, setLeftOpen]     = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openExamples, setOpenExamples] = useState([0]);

  // Behavior tracking — replaces old useBehaviorMonitor
  const { getLog, clearLog, getAnalysis, onKey } = useBehaviorTracker();
  const [pasteFlash, setPasteFlash] = useState(false);
  const editorWrapperRef = useRef(null);

  // Line/col tracking
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const editorRef = useRef(null); // Ref for Monaco instance

  const targetSlug = slug || 'two-sum';
  const contest = ACTIVE_CONTESTS.find(c => c.id === id) || ACTIVE_CONTESTS[0];

  useEffect(() => {
    async function loadProblem() {
      try {
        const data = await api.getProblem(targetSlug);
        setProblemData({
          ...data,
          examples: data.testCases ? data.testCases.filter(t => !t.isHidden).map(t => ({ input: t.input, output: t.output })) : [],
          constraints: data.constraints ? data.constraints.split('\n') : [],
        });
      } catch (err) {
        console.error("Failed to load problem", err);
      }
    }
    loadProblem();
  }, [targetSlug]);

  useSocket((event) => {
    if (event.type === 'submission_verdict') {
      const { submissionId, verdict: v, runtime, memory } = event.data;
      const verdictMap = {
        'ACCEPTED': 'accepted',
        'WRONG_ANSWER': 'wrong',
        'TIME_LIMIT_EXCEEDED': 'tle',
        'COMPILE_ERROR': 'ce',
        'RUNTIME_ERROR': 'wrong',
        'MEMORY_LIMIT_EXCEEDED': 'mle',
      };
      const finalVerdict = verdictMap[v] || 'wrong';
      setSubmitting(false);
      setRunning(false);
      setVerdict(finalVerdict);
      setOutput(prev => prev + `\n\n━━━ Judge0 Result ━━━\nVerdict: ${v}\nRuntime: ${runtime}ms | Memory: ${(memory / 1024).toFixed(1)}KB`);
      
      // Navigate to results for any finished submission after a short delay
      setTimeout(() => navigate(`/results/${submissionId}`), 3000);
    } else if (event.type === 'detection_update') {
      const { aiScore, aiVerdict, flags } = event.data;
      const formattedFlags = flags && flags.length > 0 ? flags.map(f => f.detail || f.type).join(', ') : 'None';
      setOutput(prev => prev + `\n\n━━━ AI Detection ━━━\nAI Probability: ${Math.round((aiScore || 0) * 100)}%\nVerdict: ${aiVerdict}\nFlags: ${formattedFlags}`);
    }
  });

  function handleLangChange(newLang) {
    setLang(newLang);
    const newCode = STARTER_CODE[newLang] || '';
    setCode(newCode);
    if (editorRef.current) editorRef.current.setValue(newCode);
    setVerdict(null);
    setOutput('');
  }

  function handleReset() {
    const newCode = STARTER_CODE[lang] || '';
    setCode(newCode);
    if (editorRef.current) editorRef.current.setValue(newCode);
    setVerdict(null);
    setOutput('');
  }

  async function handleRun() {
    if (!problemData) return;
    setRunning(true);
    setVerdict(null);
    setOutput('⏳ Running your code...');
    try {
      const currentCode = editorRef.current ? editorRef.current.getValue() : code;
      const customInputVal = document.getElementById('custom-input')?.value || null;
      const result = await api.submitCode(null, problemData.id, currentCode, lang, getLog(), true, customInputVal);
      
      const { verdict: v, runtime, output: out } = result;
      const verdictMap = {
        'ACCEPTED': 'accepted',
        'WRONG_ANSWER': 'wrong',
        'TIME_LIMIT_EXCEEDED': 'tle',
        'COMPILE_ERROR': 'ce',
        'RUNTIME_ERROR': 'wrong',
        'MEMORY_LIMIT_EXCEEDED': 'mle',
      };
      
      setVerdict(verdictMap[v] || 'wrong');
      setOutput(`━━━ Run Result ━━━\nVerdict: ${v}\nRuntime: ${runtime}ms\n\nOutput:\n${out || "No output"}`);
      setRunning(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setOutput(`❌ Error: ${msg}`);
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!problemData) return;
    setSubmitting(true);
    setVerdict(null);
    setOutput('⏳ Submitting code for final evaluation...');
    try {
      const currentCode = editorRef.current ? editorRef.current.getValue() : code;
      const result = await api.submitCode(id || null, problemData.id, currentCode, lang, getLog());
      setOutput(prev => prev + `\nSubmission ID: ${result.id}\nCode + behavior trace sent.\nWaiting for Judge0 + AI Detection...`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setOutput(`❌ Submission Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!problemData) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>Loading problem...</div>;
  }

  function handleEditorPaste() {
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
          <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{problemData.title}</span>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>|</span>
          <DifficultyBadge level={problemData.difficulty} />
        </div>

        <div style={{ flex: 1 }} />

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>Ends in</span>
          <ContestTimer endsAt={contest.endsAt} />
        </div>

        <div style={{ flex: 1 }} />

        {/* Problem tabs hidden when not in contest mode */}
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
          width: leftOpen && !isExpanded ? '30%' : 0,
          minWidth: leftOpen && !isExpanded ? 280 : 0,
          maxWidth: leftOpen && !isExpanded ? 420 : 0,
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
                <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>{problemData.title}</h1>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <DifficultyBadge level={problemData.difficulty} />
                <span style={{
                  fontSize: 11, padding: '2px 8px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 4, color: '#10B981',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  Acceptance: {problemData.totalAttempts > 0 ? ((problemData.totalAccepted / problemData.totalAttempts) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#CBD5E1', marginBottom: 24, whiteSpace: 'pre-wrap' }}>
              <ProblemText text={problemData.description} />
            </div>

            {/* Examples */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Examples
              </div>
              {problemData.examples && problemData.examples.map((ex, i) => (
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
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, padding: 0 }}>
                {problemData.constraints && problemData.constraints.map((c, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#7C3AED', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, marginTop: 3 }}>►</span>
                    <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#CBD5E1' }}>{c}</code>
                  </li>
                ))}
              </ul>
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

            <button 
              aria-label={isExpanded ? "Collapse" : "Fullscreen"} 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', padding: 4,
              }}>
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
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
                defaultValue={code}
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
                  editorRef.current = editor;
                  editor.onDidChangeCursorPosition(e => {
                    setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                  });
                  // Bind behavior tracking directly to the editor's textarea
                  editor.onKeyDown((e) => onKey(e.browserEvent));
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

          {/* Custom stdin input */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
            <label htmlFor="custom-input" style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              Custom Input (stdin for Run)
            </label>
            <textarea
              id="custom-input"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11.5, resize: 'vertical',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 6, padding: '8px 10px',
                color: '#94A3B8', outline: 'none',
                lineHeight: 1.6,
              }}
              placeholder={'2 7 11 15\n9'}
              aria-label="Custom stdin input"
            />
            <div style={{ fontSize: 10.5, color: '#374151', marginTop: 5, lineHeight: 1.5 }}>
              Stdin-based: edit above → Run<br/>
              Class-based: add test calls in editor → Run
            </div>
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
      <StatusBar lang={lang} cursorPos={cursorPos} analysis={getAnalysis()} />
    </div>
  );
}

const StatusBar = memo(({ lang, cursorPos, analysis }) => {
  return (
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
      {analysis && analysis.stats && analysis.stats.tabSwitches > 0 && (
        <div
          className="behavior-dot"
          title={`AI Tracker: ${analysis.stats.tabSwitches} tab switch(es), ${analysis.stats.pastes} paste(s)`}
          style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }} />
          <span style={{ color: '#F59E0B', fontSize: 11 }}>
            <AlertTriangle size={10} style={{ display: 'inline' }} /> Behavior flagged
          </span>
        </div>
      )}
      <span style={{ color: '#10B981' }}>● Connected</span>
    </div>
  );
});

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
