import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

// lucide-react doesn't ship brand logos — inline SVG instead
function GithubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate                = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Try any email + password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background violet glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Animated grid */}
      <div className="grid-bg" style={{ opacity: 0.5 }} />

      {/* Login card */}
      <div className="page-enter" style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 0 80px rgba(124,58,237,0.08)',
      }}>

        {/* Logo + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 0 24px rgba(124,58,237,0.3)',
          }}>
            <Zap size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Sign in to CodeVerify
          </h1>
          <p style={{ color: '#64748B', fontSize: 13 }}>
            Welcome back. Let's verify your code.
          </p>
        </div>

        {/* GitHub OAuth */}
        <button
          aria-label="Continue with GitHub"
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%', padding: '11px 16px',
            background: '#161B22',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#F1F5F9',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.15s',
            marginBottom: 24,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#1C2128';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#161B22';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <GithubIcon size={18} />
          Continue with GitHub
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ color: '#64748B', fontSize: 12 }}>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: '#94A3B8', marginBottom: 6, letterSpacing: '0.03em',
              }}
            >
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label
                htmlFor="password"
                style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.03em' }}
              >
                PASSWORD
              </label>
              <a href="#" style={{ fontSize: 12, color: '#00D4FF', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex', alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6,
              color: '#EF4444',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            aria-label="Sign in"
            style={{
              width: '100%',
              padding: '12px',
              background: loading
                ? 'rgba(0,212,255,0.5)'
                : 'linear-gradient(135deg, #00D4FF, #0099CC)',
              border: 'none',
              borderRadius: 8,
              color: '#0D0D12',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
              marginTop: 4,
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.boxShadow = '0 0 20px rgba(0,212,255,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(0,0,0,0.25)',
                  borderTopColor: '#0D0D12',
                  borderRadius: '50%',
                  animation: 'loginSpin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
                Signing in...
              </>
            ) : (
              <>Sign in <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Register link */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/dashboard" style={{ color: '#00D4FF', textDecoration: 'none', fontWeight: 500 }}>
            Create one free
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
