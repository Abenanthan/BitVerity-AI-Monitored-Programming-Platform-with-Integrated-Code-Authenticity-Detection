import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { User, Mail, Shield, Calendar, Code } from 'lucide-react';
import { api } from '../utils/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await api.getMe();
        setUser(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading || !user) {
    return <div style={{ background: '#0D0D12', height: '100vh' }} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: '#fff' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40, marginLeft: 64 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 700
            }}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{user.username}</h1>
              <p style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} /> {user.email}
              </p>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="#10B981" /> Performance Stats
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Trust Score</span>
                  <span style={{ color: '#10B981', fontWeight: 700, fontSize: 18 }}>{user.trustScore.toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Problems Solved</span>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>{user.totalSolved}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#00D4FF" /> Account Info
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Joined</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Account Type</span>
                  <span style={{ color: '#7C3AED', fontWeight: 600 }}>Standard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
