import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken) {
      localStorage.setItem('codeverify_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('codeverify_refresh_token', refreshToken);
      }
      navigate('/dashboard');
    } else {
      console.error('No access token found in URL');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D0D12',
      color: '#64748B',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
    }}>
      <div className="pulse">COMPLETING AUTHENTICATION...</div>
    </div>
  );
}
