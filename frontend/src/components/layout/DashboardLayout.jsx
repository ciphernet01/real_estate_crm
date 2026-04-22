import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/agents', label: 'Agents' },
  { to: '/deals', label: 'Deals' },
  { to: '/leads', label: 'Leads' },
  { to: '/properties', label: 'Properties' },
  { to: '/clients', label: 'Clients' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', flexDirection: 'column' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Top Header matching reference design */}
      <header style={{
        background: '#e0e7ff', // very light blue wrapper from image
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '4px solid #312e81', // bottom visual anchor
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
      }}>
        
        {/* Left Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#0ea5e9',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>C</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>CRM dashboard</h1>
            <span style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 600, textTransform: 'uppercase' }}>COUPLER.IO DEMO</span>
          </div>
        </div>

        {/* Center Pill Nav */}
        <nav style={{
          background: '#1e3a8a',
          padding: '6px',
          borderRadius: '999px',
          display: 'flex',
          gap: '4px'
        }}>
          {navItems.slice(0, 3).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                padding: '8px 24px',
                borderRadius: '999px',
                color: 'white',
                fontWeight: 500,
                fontSize: '0.9rem',
                textDecoration: 'none',
                background: isActive ? '#3b82f6' : 'transparent',
                transition: 'background 0.2s ease'
              })}
            >
              {item.label}
            </NavLink>
          ))}
          {/* Menu for remaining items since the navbar only shows 3 main ones to match image */}
          <div style={{
            padding: '8px 24px',
            borderRadius: '999px',
            color: 'white',
            fontWeight: 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            More ▾
            <select aria-label="More navigation links" style={{
              position: 'absolute', opacity: 0, cursor: 'pointer', width: '50px'
            }} onChange={(e) => window.location.href = e.target.value}>
              <option value="">...</option>
              {navItems.slice(3).map(item => <option key={item.to} value={item.to}>{item.label}</option>)}
            </select>
          </div>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{
            background: 'white',
            color: '#1e40af',
            border: 'none',
            borderRadius: '999px',
            padding: '10px 24px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>Setup dashboard</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{user?.name || 'User'}</span>
            <button onClick={logout} style={{
              background: 'transparent',
              border: '1px solid #94a3b8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              color: '#475569'
            }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" style={{ padding: '24px', flex: 1 }} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
