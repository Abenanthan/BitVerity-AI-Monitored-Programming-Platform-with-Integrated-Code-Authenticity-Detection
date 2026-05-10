import { useState } from 'react';
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';

/**
 * Parses "nums = [2,7,11,15], target = 9" into
 * [{ label: 'nums', value: '[2,7,11,15]' }, { label: 'target', value: '9' }]
 */
function parseSampleInput(sampleInput) {
  if (!sampleInput) return [];
  const regex = /(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\[.*?\]|-?\d+(?:\.\d+)?|true|false|null|\w+)/g;
  const result = [];
  let match;
  while ((match = regex.exec(sampleInput)) !== null) {
    result.push({ label: match[1], value: match[2] });
  }
  return result;
}

/**
 * Given a test case raw input string (lines) and parameter labels,
 * map each line to its label.
 */
function mapInputToLabels(rawInput, paramLabels) {
  if (!rawInput) return [];
  const lines = rawInput.split('\n').filter(l => l.trim() !== '');
  return lines.map((line, i) => ({
    label: paramLabels[i]?.label || `input${i + 1}`,
    value: line.trim(),
  }));
}

export default function TestCasePanel({
  examples = [],          // [{ input, output }] — visible test cases from problemData
  sampleInput = '',       // "nums = [2,7,11,15], target = 9"  — for label parsing
  runResult = null,       // { verdict, runtime, memory, testResults: [{ passed, output, expected }] }
  isRunning = false,
}) {
  const [activeTab, setActiveTab] = useState('testcase'); // 'testcase' | 'result'
  const [activeCase, setActiveCase] = useState(0);

  // Switch to result tab when a run completes
  const displayedTab = (runResult || isRunning) ? 'result' : activeTab;

  const paramLabels = parseSampleInput(sampleInput);
  const visibleCases = examples.slice(0, 3);

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: displayedTab === tab ? '#F1F5F9' : '#64748B',
    borderBottom: displayedTab === tab ? '2px solid #00D4FF' : '2px solid transparent',
    transition: 'all 0.15s',
  });

  const caseTabStyle = (idx, passed) => {
    let bg = activeCase === idx ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
    let border = activeCase === idx ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)';
    let color = '#CBD5E1';
    if (passed === true)  { border = '1px solid #10B98140'; color = '#10B981'; bg = activeCase === idx ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)'; }
    if (passed === false) { border = '1px solid #EF444440'; color = '#EF4444'; bg = activeCase === idx ? 'rgba(239,68,68,0.12)'  : 'rgba(239,68,68,0.06)'; }
    return {
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 6,
      fontSize: 12.5, fontWeight: 600,
      fontFamily: 'Inter, sans-serif',
      cursor: 'pointer', border, color, background: bg,
      transition: 'all 0.15s',
    };
  };

  const fieldStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '10px 14px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  };

  const labelStyle = {
    fontSize: 11.5,
    color: '#64748B',
    fontFamily: 'Inter, sans-serif',
    marginBottom: 4,
    textTransform: 'lowercase',
  };

  /* ── Render ── */
  return (
    <div style={{
      height: 240,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        paddingLeft: 8,
        flexShrink: 0,
      }}>
        <button style={tabStyle('testcase')} onClick={() => setActiveTab('testcase')}>
          ✅ Testcase
        </button>
        <button style={tabStyle('result')} onClick={() => setActiveTab('result')}>
          {'>_'} Test Result
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>

        {/* ── TESTCASE TAB ── */}
        {displayedTab === 'testcase' && (
          <div>
            {/* Case selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {visibleCases.map((_, i) => (
                <button key={i} style={caseTabStyle(i, undefined)} onClick={() => setActiveCase(i)}>
                  Case {i + 1}
                </button>
              ))}
            </div>

            {/* Input fields */}
            {visibleCases[activeCase] && (() => {
              const fields = mapInputToLabels(visibleCases[activeCase].input, paramLabels);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={labelStyle}>Input</div>
                  {fields.map((f, i) => (
                    <div key={i}>
                      <div style={labelStyle}>{f.label} =</div>
                      <div style={fieldStyle}>{f.value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── RESULT TAB ── */}
        {displayedTab === 'result' && (
          <div>
            {isRunning && (
              <div style={{ color: '#64748B', fontFamily: 'Inter, sans-serif', fontSize: 13, paddingTop: 8 }}>
                <span style={{ marginRight: 8 }}>⏳</span> Running test cases...
              </div>
            )}

            {!isRunning && !runResult && (
              <div style={{ color: '#374151', fontFamily: 'Inter, sans-serif', fontSize: 13, paddingTop: 8 }}>
                Run your code to see results.
              </div>
            )}

            {!isRunning && runResult && (() => {
              const { verdict, runtime, memory, testResults = [] } = runResult;
              const isAccepted = verdict === 'ACCEPTED';
              const verdictColor = isAccepted ? '#10B981' : '#EF4444';
              const verdictLabel = isAccepted ? 'Accepted' : verdict?.replace(/_/g, ' ') || 'Wrong Answer';

              return (
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: verdictColor, fontFamily: 'Inter, sans-serif' }}>
                      {verdictLabel}
                    </span>
                    {runtime != null && (
                      <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif' }}>
                        <Clock size={12} /> Runtime: {runtime} ms
                      </span>
                    )}
                  </div>

                  {/* Per-case chips */}
                  {testResults.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        {testResults.slice(0, 3).map((tr, i) => (
                          <button key={i} style={caseTabStyle(i, tr.passed)} onClick={() => setActiveCase(i)}>
                            {tr.passed
                              ? <CheckCircle size={12} />
                              : <XCircle size={12} />
                            }
                            Case {i + 1}
                          </button>
                        ))}
                      </div>

                      {/* Selected case detail */}
                      {testResults[activeCase] && (() => {
                        const tr = testResults[activeCase];
                        const isHidden = tr.isHidden;
                        const fields = mapInputToLabels(tr.input || '', paramLabels);
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={labelStyle}>Input {isHidden && <span style={{ color: '#F59E0B', fontSize: 10 }}>(Hidden Case)</span>}</div>
                              <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono' }}>{tr.status}</div>
                            </div>
                            {fields.map((f, i) => (
                              <div key={i}>
                                <div style={labelStyle}>{f.label} =</div>
                                <div style={fieldStyle}>{f.value}</div>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={labelStyle}>Output</div>
                                <div style={{ ...fieldStyle, color: tr.passed ? '#10B981' : '#EF4444' }}>
                                  {tr.output ?? '(no output)'}
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={labelStyle}>Expected</div>
                                <div style={fieldStyle}>{tr.expected}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* No per-case data (submission result only) */}
                  {testResults.length === 0 && (
                    <div style={{ color: '#64748B', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                      Detailed case results not available. Check the Output panel.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
