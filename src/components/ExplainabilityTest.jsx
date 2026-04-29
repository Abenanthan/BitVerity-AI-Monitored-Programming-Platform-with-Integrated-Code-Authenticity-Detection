import { useState, useEffect, useRef } from 'react';
import { Brain, Clock, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

export default function ExplainabilityTest({ submissionId, code, language, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  
  const textareaRef = useRef(null);
  const pasteCountRef = useRef(0);
  const tabSwitchesRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await api.client.post('/explain/generate', { code, language });
        setQuestions(res.data.data || []);
      } catch (err) {
        console.error("Failed to generate questions:", err);
        setQuestions([
          "Explain the core logic of your solution.",
          "What is the time and space complexity of your code?",
          "Why did you choose this specific approach over other alternatives?"
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [code, language]);

  useEffect(() => {
    if (loading || questions.length === 0 || currentIdx >= questions.length) return;

    // Reset tracking for this question
    pasteCountRef.current = 0;
    tabSwitchesRef.current = 0;
    startTimeRef.current = Date.now();
    setCurrentAnswer('');
    setTimeLeft(20);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleNextQuestion(true); // auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const onVisibility = () => {
      if (document.hidden) tabSwitchesRef.current++;
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [currentIdx, loading, questions]);

  const handleNextQuestion = async (autoSubmitted = false) => {
    clearInterval(timerRef.current);
    
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const answerData = {
      question: questions[currentIdx],
      answer: currentAnswer,
      pasteCount: pasteCountRef.current,
      tabSwitches: tabSwitchesRef.current,
      timeTaken: autoSubmitted ? 20 : timeTaken
    };

    const newAnswers = [...answers, answerData];
    setAnswers(newAnswers);

    if (currentIdx + 1 >= questions.length) {
      setSubmitting(true);
      try {
        await api.client.post('/explain/evaluate', {
          submissionId,
          code,
          language,
          answers: newAnswers
        });
        onComplete();
      } catch (err) {
        console.error("Evaluation failed", err);
        onComplete(); // Still complete to unblock user
      }
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePaste = () => {
    pasteCountRef.current++;
  };

  if (loading) {
    return (
      <div style={{ padding: 24, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Brain className="animate-pulse" size={24} color="#00D4FF" />
        <div style={{ color: '#94A3B8', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>Generating Explainability Test...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null; // Skip if generation failed entirely
  }

  if (submitting) {
    return (
      <div style={{ padding: 24, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Brain className="animate-pulse" size={24} color="#10B981" />
        <div style={{ color: '#10B981', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>Evaluating Answers...</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      padding: 24,
      flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={18} color="#00D4FF" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>Explainability Test ({currentIdx + 1}/{questions.length})</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: timeLeft <= 5 ? '#EF4444' : '#F59E0B' }}>
          <Clock size={14} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700 }}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div style={{ background: 'rgba(0,212,255,0.05)', padding: 16, borderRadius: 8, border: '1px solid rgba(0,212,255,0.1)' }}>
        <p style={{ fontSize: 14, color: '#E2E8F0', margin: 0, lineHeight: 1.5 }}>
          {questions[currentIdx]}
        </p>
      </div>

      <textarea
        ref={textareaRef}
        value={currentAnswer}
        onChange={e => setCurrentAnswer(e.target.value)}
        onPaste={handlePaste}
        placeholder="Type your explanation here..."
        style={{
          width: '100%',
          height: 100,
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 12,
          color: '#CBD5E1',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = '#00D4FF'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
        autoFocus
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn-primary"
          onClick={() => handleNextQuestion(false)}
          disabled={!currentAnswer.trim()}
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          {currentIdx === questions.length - 1 ? 'Finish' : 'Next Question'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
