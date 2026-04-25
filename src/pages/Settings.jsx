import React from 'react';
import Sidebar from '../components/Sidebar';
import { Settings as SettingsIcon, Bell, Lock, Eye, Monitor } from 'lucide-react';

export default function Settings() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: '#fff' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40, marginLeft: 64 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <header style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <SettingsIcon size={24} color="#64748B" />
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>Settings</h1>
            </div>
            <p style={{ color: '#64748B' }}>Manage your account preferences and security.</p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: Bell, title: 'Notifications', desc: 'Configure how you receive alerts and updates.' },
              { icon: Lock, title: 'Security', desc: 'Change your password and manage two-factor authentication.' },
              { icon: Eye, title: 'Privacy', desc: 'Control who can see your profile and submission history.' },
              { icon: Monitor, title: 'Appearance', desc: 'Customize the editor theme and dashboard layout.' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#00D4FF'
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.title}</h3>
                    <p style={{ color: '#64748B', fontSize: 13 }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
