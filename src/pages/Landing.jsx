import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Trophy, ChevronDown } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'AI Detection Engine',
    desc: 'Real-time analysis of code patterns, behavioral signals, and style fingerprinting to identify AI-generated submissions with 99.2% accuracy.',
    color: '#00D4FF',
    glow: 'rgba(0,212,255,0.15)',
  },
  {
    icon: Trophy,
    title: 'Live Contests',
    desc: 'Compete in weekly and biweekly contests with thousands of developers. Timed execution, real verdicts, and a global leaderboard.',
    color: '#7C3AED',
    glow: 'rgba(124,58,237,0.15)',
  },
  {
    icon: Shield,
    title: 'Trust Score System',
    desc: 'Build your verified coding reputation. Every submission contributes to your Trust Score — a transparent proof of authentic skill.',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.15)',
  },
];

const CODE_SNIPPET = `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target-n], i]
        seen[n] = i`;

export default function Landing() {
  const heroRef = useRef(null);
  const featRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.style.animation = 'fadeIn 0.6s ease-out forwards';
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.scroll-reveal').forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ---- NAV ---- */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 100,
        background: 'rgba(13,13,18,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.5px' }}>CodeVerify</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Features', 'Contests', 'Leaderboard', 'Pricing'].map(item => (
            <a key={item} href="#features" style={{ color: '#64748B', textDecoration: 'none', fontSize: 14, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#F1F5F9'}
              onMouseLeave={e => e.target.style.color = '#64748B'}
            >{item}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn-ghost" style={{ padding: '8px 20px', fontSize: 13 }}>Sign in</Link>
          <Link to="/dashboard" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>Get Started</Link>
        </div>
      </nav>

      {/* ---- HERO ---- */}
      <section ref={heroRef} style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '0 48px',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 64,
      }}>
        {/* Grid background */}
        <div className="grid-bg grid-bg-animated" />

        {/* Cyan glow blob */}
        <div style={{
          position: 'absolute', top: '20%', left: '30%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto', width: '100%',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 80, alignItems: 'center',
          position: 'relative', zIndex: 1,
        }}>
          {/* Left content */}
          <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 20, marginBottom: 24,
              fontSize: 12, fontWeight: 600, color: '#00D4FF',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 6px #00D4FF' }} />
              AI-Powered Code Integrity Platform
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 60px)',
              fontWeight: 800,
              letterSpacing: '-1px',
              lineHeight: 1.1,
              marginBottom: 24,
              background: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Code. Compete.<br />
              <span style={{
                background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Prove It's Yours.</span>
            </h1>

            <p style={{
              fontSize: 17, color: '#64748B', lineHeight: 1.8,
              marginBottom: 40, maxWidth: 480,
            }}>
              The only competitive programming platform with built-in AI detection.
              Every submission is analyzed for authenticity — so your victories mean something.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
                Start Competing <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn-ghost" style={{ fontSize: 15, padding: '12px 28px' }}>
                See How It Works <ChevronDown size={16} />
              </a>
            </div>

            {/* Micro stats */}
            <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
              {[
                { value: '10K+',  label: 'Problems' },
                { value: '50K+',  label: 'Developers' },
                { value: '99.2%', label: 'AI Accuracy' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#00D4FF' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating code card */}
          <div style={{ position: 'relative', animation: 'fadeIn 1s ease-out 0.2s both' }}>
            {/* Main code card */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(0,212,255,0.08)',
            }}>
              {/* Editor top bar */}
              <div style={{
                background: '#0a0a10',
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ marginLeft: 8, fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>solution.py</span>
              </div>

              {/* Code */}
              <pre style={{
                padding: '20px 24px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                lineHeight: 1.7,
                color: '#94A3B8',
                overflow: 'auto',
                margin: 0,
              }}>
                <code>
                  {CODE_SNIPPET.split('\n').map((line, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                      <span style={{ color: '#2D3748', userSelect: 'none', minWidth: 20, textAlign: 'right' }}>{i + 1}</span>
                      <span dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
                    </div>
                  ))}
                </code>
              </pre>

              {/* AI Detection result */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '16px 24px',
                background: 'rgba(16,185,129,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>AI Detection Score</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>12% — Human</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: '12%', height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, #10B981, #34D399)',
                    boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  {[
                    { label: 'Behavioral', val: '8%',  color: '#10B981' },
                    { label: 'Patterns',   val: '15%', color: '#10B981' },
                    { label: 'Style',      val: '9%',  color: '#10B981' },
                  ].map(m => (
                    <span key={m.label} style={{
                      fontSize: 10, color: '#64748B',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {m.label}: <span style={{ color: m.color }}>{m.val}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 10, padding: '10px 16px',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>VERDICT</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>
                ✓ HUMAN VERIFIED
              </div>
            </div>

            {/* Floating trust score */}
            <div style={{
              position: 'absolute', bottom: -20, left: -20,
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '10px 16px',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>TRUST SCORE</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#00D4FF', fontFamily: 'JetBrains Mono, monospace' }}>
                92 <span style={{ fontSize: 11, color: '#64748B' }}>/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#features" style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: '#64748B', textDecoration: 'none', fontSize: 11,
          animation: 'bounce 2s ease-in-out infinite',
        }}>
          <ChevronDown size={18} />
        </a>
      </section>

      {/* ---- FEATURES ---- */}
      <section id="features" style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#00D4FF', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            Why CodeVerify
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 16 }}>
            Built for Authentic Competition
          </h2>
          <p style={{ color: '#64748B', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Every tool engineered to detect, verify, and reward genuine coding skill.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="scroll-reveal card-hover card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `radial-gradient(circle, ${f.glow}, transparent)`,
                  border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
                <p style={{ color: '#64748B', lineHeight: 1.7, fontSize: 13 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- STATS BAR ---- */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 48px',
        display: 'flex', justifyContent: 'center', gap: 80,
        flexWrap: 'wrap',
      }}>
        {[
          { value: '10K+',  label: 'Problems',         color: '#00D4FF' },
          { value: '50K+',  label: 'Developers',       color: '#7C3AED' },
          { value: '99.2%', label: 'Detection Accuracy', color: '#10B981' },
          { value: '1.2M+', label: 'Submissions',      color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ---- CTA SECTION ---- */}
      <section style={{ padding: '100px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="scroll-reveal" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 20 }}>
            Ready to prove your skills?
          </h2>
          <p style={{ color: '#64748B', fontSize: 16, marginBottom: 40 }}>
            Join 50,000+ developers competing on the only platform that truly verifies your code.
          </p>
          <Link to="/dashboard" className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
            Start for Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: '#64748B', fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={13} color="#fff" />
          </div>
          <span style={{ fontWeight: 600, color: '#F1F5F9' }}>CodeVerify</span>
        </div>
        <span>© 2025 CodeVerify. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" style={{ color: '#64748B', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#F1F5F9'}
              onMouseLeave={e => e.target.style.color = '#64748B'}
            >{l}</a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  );
}

function syntaxHighlight(line) {
  return line
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(def|return|for|in|if)\b/g, '<span style="color:#7C3AED">$1</span>')
    .replace(/(".*?"|'.*?')/g, '<span style="color:#F59E0B">$1</span>')
    .replace(/(\d+)/g, '<span style="color:#F59E0B">$1</span>')
    .replace(/(#.*$)/g, '<span style="color:#374151">$1</span>');
}
