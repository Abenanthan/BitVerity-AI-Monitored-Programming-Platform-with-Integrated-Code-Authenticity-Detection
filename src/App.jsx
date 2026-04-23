import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load all pages for code splitting
const Landing  = lazy(() => import('./pages/Landing'));
const Login    = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Problems = lazy(() => import('./pages/Problems'));
const Contest  = lazy(() => import('./pages/Contest'));
const Results  = lazy(() => import('./pages/Results'));
const Workspace = lazy(() => import('./pages/Workspace'));

function PageLoader() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D0D12',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Animated logo */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulseLoader 1.5s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 24 }}>⚡</span>
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        color: '#64748B',
        letterSpacing: '0.1em',
      }}>
        LOADING...
      </div>
      <style>{`
        @keyframes pulseLoader {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"             element={<Navigate to="/landing" replace />} />
          <Route path="/landing"      element={<Landing />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/problems"     element={<Problems />} />
          <Route path="/contest/:id"  element={<Contest />} />
          <Route path="/workspace/:problemId" element={<Workspace />} />
          <Route path="/editor" element={<Workspace />} />
          <Route path="/results/:id"  element={<Results />} />
          {/* Catch-all */}
          <Route path="*"             element={<Navigate to="/landing" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
