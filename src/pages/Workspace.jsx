import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Send, Activity, ChevronLeft,
  CheckCircle, XCircle, RotateCcw, ChevronDown, Loader
} from 'lucide-react';
import { api } from '../utils/api';
import { useBehaviorTracker } from '../hooks/useBehaviorTracker';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const LANGUAGES = {
  python:     { label: 'Python 3',    monacoLang: 'python',     compiler: 'cpython-3.10.15' },
  javascript: { label: 'JavaScript',  monacoLang: 'javascript', compiler: 'nodejs-20.10.0' },
};

async function runWandbox(code, compiler) {
  try {
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code, save: false }),
    });
    if (!res.ok) return { stdout: '', stderr: `API Error ${res.status}`, exitCode: 1 };
    const d = await res.json();
    return {
      stdout: d.program_output || '',
      stderr: (d.compiler_error || '') + (d.program_error || ''),
      exitCode: d.status === '0' ? 0 : 1,
    };
  } catch (e) {
    return { stdout: '', stderr: `Network error: ${e.message}`, exitCode: 1 };
  }
}

export default function Workspace() {
  const { problemId } = useParams();
  const navigate      = useNavigate();
  const { getLog, clearLog } = useBehaviorTracker();

  const [problem, setProblem]   = useState(null);
  const [code, setCode]         = useState('');
  const [langKey, setLangKey]   = useState('python');
  const lang = LANGUAGES[langKey];

  // Right-panel state
  const [outputLines, setOutputLines]  = useState([]);   // { text, kind: 'out'|'err'|'sys'|'ok' }
  const [testResults, setTestResults]  = useState(null); // null = not submitted yet
  const [verdict, setVerdict]          = useState(null);
  const [rightTab, setRightTab]        = useState('output'); // 'output' | 'tests'

  const [isRunning,    setIsRunning]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);

  const outputEndRef = useRef(null);

  useEffect(() => {
    api.getProblem(problemId).then(data => {
      setProblem(data);
      setCode(data.initialCode || '');
    }).catch(console.error);
  }, [problemId]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines]);

  function pushOut(kind, text) {
    setOutputLines(prev => [...prev, { kind, text }]);
  }

  // ── RUN ──────────────────────────────────────────────────────────
  async function handleRun() {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setRightTab('output');
    setOutputLines([{ kind: 'sys', text: `▶ Running with ${lang.label}…` }]);

    const { stdout, stderr, exitCode } = await runWandbox(code, lang.compiler);

    const newLines = [];
    if (stdout) stdout.trimEnd().split('\n').forEach(l => newLines.push({ kind: 'out', text: l }));
    if (stderr) stderr.trimEnd().split('\n').forEach(l => newLines.push({ kind: 'err', text: l }));
    if (!stdout && !stderr) newLines.push({ kind: 'sys', text: '(no output)' });
    newLines.push({ kind: exitCode === 0 ? 'ok' : 'err', text: exitCode === 0 ? '✓ Exited with code 0' : `✗ Exited with code ${exitCode}` });

    setOutputLines(newLines);
    setIsRunning(false);
  }

  // ── SUBMIT ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (isRunning || isSubmitting || !problem) return;
    setIsSubmitting(true);
    setRightTab('tests');
    setTestResults(null);
    setVerdict(null);
    setOutputLines([{ kind: 'sys', text: `⏳ Judging "${problem.title}"…` }]);

    const logs = getLog();
    try {
      const result = await api.submitCode(null, problemId, code, langKey, logs);
      setTestResults(result.testCases);
      setVerdict(result.verdict);

      if (result.verdict === 'accepted') {
        setOutputLines([{ kind: 'ok', text: `✓ All ${result.testCases.length} test cases passed!` }]);
        setTimeout(() => navigate(`/results/${result.id}`), 3000);
      } else {
        const f = result.testCases.filter(t => !t.passed).length;
        setOutputLines([{ kind: 'err', text: `✗ ${f} of ${result.testCases.length} test cases failed.` }]);
      }
      clearLog();
    } catch (err) {
      setOutputLines([{ kind: 'err', text: `Error: ${err.message}` }]);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!problem) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D12', color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, flexDirection: 'column', gap: 12 }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        Loading workspace…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D0D12', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <header style={{ height: 50, flexShrink: 0, background: '#13131A', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ChevronLeft size={15} /> Back
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)' }} />

        {/* Problem name + badge */}
        <span style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9' }}>{problem.title}</span>
        <DiffBadge level={problem.difficulty} />

        <div style={{ flex: 1 }} />

        {/* AI pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 20, padding: '3px 11px' }}>
          <Activity size={11} color="#00D4FF" />
          <span style={{ fontSize: 11, color: '#00D4FF', fontFamily: 'JetBrains Mono, monospace' }}>AI Tracker</span>
        </div>

        {/* Lang dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setLangOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#E2E8F0', padding: '5px 12px', fontSize: 13, cursor: 'pointer' }}>
            {lang.label}
            <ChevronDown size={12} style={{ color: '#64748B', transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
          </button>
          {langOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 150, background: '#1C1C27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {Object.entries(LANGUAGES).map(([key, cfg]) => (
                <button key={key} onClick={() => { setLangKey(key); setLangOpen(false); }} style={{ width: '100%', display: 'block', textAlign: 'left', padding: '9px 16px', background: key === langKey ? 'rgba(0,212,255,0.08)' : 'none', border: 'none', color: key === langKey ? '#00D4FF' : '#CBD5E1', fontSize: 13, cursor: 'pointer' }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        <button onClick={() => { setCode(problem.initialCode || ''); }} title="Reset code" style={ICON_BTN}>
          <RotateCcw size={14} />
        </button>

        {/* Run */}
        <button onClick={handleRun} disabled={isRunning || isSubmitting} style={{ ...ACTION_BTN, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#E2E8F0' }}>
          {isRunning ? <SpinIcon /> : <Play size={13} fill="currentColor" />}
          {isRunning ? 'Running…' : 'Run'}
        </button>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={isRunning || isSubmitting} style={{ ...ACTION_BTN, background: isSubmitting ? 'rgba(0,212,255,0.3)' : 'linear-gradient(135deg,#00D4FF,#0099CC)', color: '#0D0D12', border: 'none', boxShadow: isSubmitting ? 'none' : '0 0 16px rgba(0,212,255,0.25)' }}>
          {isSubmitting ? <SpinIcon dark /> : <Send size={13} />}
          {isSubmitting ? 'Judging…' : 'Submit'}
        </button>
      </header>

      {/* ── 3-COLUMN BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── COL 1: Problem Description ── */}
        <div style={{ width: '30%', minWidth: 260, borderRight: '1px solid rgba(255,255,255,0.07)', background: '#13131A', overflowY: 'auto' }}>
          <div style={{ padding: '20px 20px 28px', color: '#CBD5E1', fontSize: 13.5, lineHeight: 1.75 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>{problem.title}</h1>
            <DiffBadge level={problem.difficulty} />
            <div style={{ height: 18 }} />
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: 24 }}>{problem.description}</div>

            {problem.examples?.map((ex, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: 7, fontSize: 12.5 }}>Example {i + 1}:</div>
                <div style={{ background: '#1C1C27', padding: '11px 15px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, lineHeight: 1.9 }}>
                  <div><span style={{ color: '#4B5563' }}>Input:&nbsp;</span><span style={{ color: '#94A3B8' }}>{ex.input}</span></div>
                  <div><span style={{ color: '#4B5563' }}>Output:&nbsp;</span><span style={{ color: '#10B981' }}>{ex.output}</span></div>
                  {ex.explanation && <div style={{ color: '#4B5563', marginTop: 3 }}>Explanation:&nbsp;<span style={{ color: '#94A3B8' }}>{ex.explanation}</span></div>}
                </div>
              </div>
            ))}

            {problem.constraints?.length > 0 && (
              <>
                <div style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: 8, fontSize: 12.5 }}>Constraints:</div>
                <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {problem.constraints.map((c, i) => (
                    <li key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: '#94A3B8' }}>{c}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* ── COL 2: Editor ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.07)', minWidth: 0 }}>
          {/* File tab */}
          <div style={{ height: 34, flexShrink: 0, background: '#0D0D12', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-end', paddingLeft: 12 }}>
            <div style={{ padding: '5px 14px', background: '#13131A', borderRadius: '5px 5px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid #13131A', fontSize: 11.5, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 7, marginBottom: -1 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00D4FF', display: 'inline-block' }} />
              {langKey === 'python' ? 'solution.py' : 'solution.js'}
            </div>
          </div>
          {/* Monaco */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Suspense fallback={<div style={{ padding: 20, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>Loading editor…</div>}>
              <MonacoEditor
                height="100%"
                language={lang.monacoLang}
                theme="vs-dark"
                value={code}
                onChange={val => setCode(val ?? '')}
                options={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: false },
                  padding: { top: 14, bottom: 14 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  wordWrap: 'on',
                  renderLineHighlight: 'gutter',
                  bracketPairColorization: { enabled: true },
                  tabSize: langKey === 'python' ? 4 : 2,
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* ── COL 3: Output Panel ── */}
        <div style={{ width: '28%', minWidth: 240, display: 'flex', flexDirection: 'column', background: '#0D0D12' }}>

          {/* Tab header */}
          <div style={{ height: 34, flexShrink: 0, background: '#13131A', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 2 }}>
            {[{ key: 'output', label: 'Output' }, { key: 'tests', label: 'Test Cases' }].map(t => (
              <button key={t.key} onClick={() => setRightTab(t.key)} style={{ padding: '5px 12px', background: rightTab === t.key ? 'rgba(0,212,255,0.1)' : 'none', border: 'none', borderRadius: 4, color: rightTab === t.key ? '#00D4FF' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
            {verdict && (
              <span style={{ marginLeft: 'auto', marginRight: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: verdict === 'accepted' ? '#10B981' : '#EF4444' }}>
                {verdict === 'accepted' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {verdict === 'accepted' ? 'Accepted' : 'Wrong'}
              </span>
            )}
          </div>

          {/* OUTPUT tab */}
          {rightTab === 'output' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {outputLines.length === 0 ? (
                <span style={{ color: '#374151', fontStyle: 'italic' }}>Run your code to see output here.</span>
              ) : (
                outputLines.map((line, i) => (
                  <div key={i} style={{ color: line.kind === 'err' ? '#EF4444' : line.kind === 'ok' ? '#10B981' : line.kind === 'sys' ? '#00D4FF' : '#E2E8F0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {line.text}
                  </div>
                ))
              )}
              {isRunning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748B', marginTop: 4 }}>
                  <SpinIcon /> Executing…
                </div>
              )}
              <div ref={outputEndRef} />
            </div>
          )}

          {/* TEST CASES tab */}
          {rightTab === 'tests' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {isSubmitting && (
                <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                  <SpinIcon /> Judging…
                </div>
              )}
              {!isSubmitting && !testResults && (
                <div style={{ padding: 20, color: '#374151', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                  Click Submit to evaluate test cases.
                </div>
              )}
              {testResults && testResults.map((tc, i) => (
                <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: tc.passed ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>Case {i + 1}</span>
                    {tc.passed
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 12, fontWeight: 700 }}><CheckCircle size={13} /> Passed</span>
                      : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontSize: 12, fontWeight: 700 }}><XCircle size={13} /> Failed</span>
                    }
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><span style={{ color: '#4B5563' }}>Input:&nbsp;&nbsp;&nbsp;</span><span style={{ color: '#94A3B8' }}>{tc.input}</span></div>
                    <div><span style={{ color: '#4B5563' }}>Expected:&nbsp;</span><span style={{ color: '#10B981' }}>{tc.expected}</span></div>
                    <div><span style={{ color: '#4B5563' }}>Got:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span style={{ color: tc.passed ? '#10B981' : '#EF4444' }}>{tc.output}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status bar */}
          <div style={{ height: 22, flexShrink: 0, background: '#0a0a10', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#374151' }}>
            <span>{lang.label}</span>
            <span>•</span>
            <span>Wandbox</span>
            <span>•</span>
            <span>{code.split('\n').length} lines</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
function DiffBadge({ level }) {
  const map = { EASY: ['rgba(16,185,129,0.12)', '#10B981'], MEDIUM: ['rgba(245,158,11,0.12)', '#F59E0B'], HARD: ['rgba(239,68,68,0.12)', '#EF4444'] };
  const [bg, color] = map[level] || map.EASY;
  return <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: bg, color }}>{level}</span>;
}

function SpinIcon({ dark }) {
  return <span style={{ width: 12, height: 12, border: `2px solid ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'}`, borderTop: `2px solid ${dark ? '#000' : '#fff'}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

const ICON_BTN = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#94A3B8', cursor: 'pointer',
};

const ACTION_BTN = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 16px', borderRadius: 6, fontSize: 13,
  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
};
