import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/deals', label: 'Deals' },
  { to: '/reports', label: 'Reports' },
];

const utilityItems = [
  { to: '/leads', label: 'Leads' },
  { to: '/properties', label: 'Properties' },
  { to: '/clients', label: 'Clients' },
  { to: '/settings', label: 'Settings' },
];

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="enterprise-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="enterprise-header-wrap">
        <div className="enterprise-brand">
          <div className="enterprise-logo">C</div>
          <div>
            <h1>CRM dashboard</h1>
            <span>COUPLER.IO DEMO</span>
          </div>
        </div>

        <nav className="enterprise-pill-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'enterprise-pill active' : 'enterprise-pill')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="enterprise-header-right">
          <NavLink to="/settings" className="enterprise-setup-btn">
            Setup dashboard
          </NavLink>
          <div className="enterprise-user-chip">
            <span>{user?.name || 'User'}</span>
            <button type="button" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <nav className="enterprise-secondary-nav" aria-label="Workspace navigation">
        {utilityItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'secondary-item active' : 'secondary-item')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main id="main-content" className="enterprise-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
