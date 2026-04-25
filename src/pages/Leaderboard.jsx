import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Trophy, Medal, Users, TrendingUp } from 'lucide-react';
import { api } from '../utils/api';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await api.getLeaderboard(); // I'll need to add this to api.js or use axios directly
        setUsers(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: '#fff' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40, marginLeft: 64 }}>
        <header style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Trophy color="#F59E0B" size={24} />
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>Global Leaderboard</h1>
          </div>
          <p style={{ color: '#64748B' }}>The top performing developers in the CodeVerify ecosystem.</p>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Rank</th>
                <th>Developer</th>
                <th>Problems Solved</th>
                <th>Trust Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Loading rankings...</td></tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: i === 0 ? '#F59E0B20' : i === 1 ? '#94A3B820' : i === 2 ? '#B4530920' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#B45309' : '#64748B',
                        fontWeight: 700, fontSize: 13
                      }}>
                        {i + 1}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #00D4FF, #7C3AED)' }} />
                        <span style={{ fontWeight: 600 }}>{user.username}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{user.totalSolved}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981' }}>
                        <TrendingUp size={14} />
                        {user.trustScore.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
