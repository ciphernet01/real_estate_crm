import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { CommandPalette } from './CommandPalette.jsx';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/deals', label: 'Deals' },
  { to: '/reports', label: 'Reports' },
];

const subNavItems = [
  { to: '/leads', label: 'Leads' },
  { to: '/properties', label: 'Properties' },
  { to: '/clients', label: 'Clients' },
  { to: '/settings', label: 'Settings' },
];

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="premium-shell">
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      
      <header className="premium-header">
        <div className="premium-brand">
          <div className="premium-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="brand-text">
            <h1 style={{ letterSpacing: '-0.02em', color: '#f8fafc' }}>Nexus CRM</h1>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#818cf8', opacity: 1, letterSpacing: '0.1em' }}>PREMIUM ENTERPRISE</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <nav className="premium-nav-pill">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-link-pill active' : 'nav-link-pill')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <nav style={{ display: 'flex', gap: '20px' }}>
            {subNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: isActive ? '#f8fafc' : '#64748b',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  letterSpacing: '0.02em'
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="premium-header-right">
          <button 
            onClick={() => setIsPaletteOpen(true)}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid var(--border-glass)', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer', 
              marginRight: '16px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Quick Actions</span>
            <kbd style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-glass)', color: '#f8fafc', fontWeight: 800 }}>⌘K</kbd>
          </button>

          <div className="notification-bell">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="notification-badge"></span>
          </div>

          <div className="user-profile-chip" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '4px 12px' }}>
            <div className="user-info" style={{ textAlign: 'right' }}>
              <span className="user-name" style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700 }}>{user?.name || 'Kanika Sharma'}</span>
              <span className="user-role" style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'block', fontWeight: 800 }}>{user?.role || 'Senior Agent'}</span>
            </div>
            <div className="user-avatar" style={{ background: 'var(--gradient-indigo)', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.8rem', marginLeft: '12px' }}>{user?.name?.[0] || 'K'}</div>
            <button onClick={logout} className="ghost-btn" style={{ marginLeft: '12px', padding: '6px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }} title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="premium-main">
        <Outlet />
      </main>
    </div>
  );
}
