import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Briefcase, 
  BarChart3, 
  Settings, 
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/auth';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', path: '/' },
  { icon: Target, label: 'Leads Pipeline', path: '/leads' },
  { icon: Users, label: 'Clients', path: '/agents' }, // Using your existing path
  { icon: Briefcase, label: 'Deals & Escrow', path: '/deals' },
  { icon: BarChart3, label: 'Performance', path: '/reports' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="enterprise-sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Building2 size={24} color="#4f63ff" />
        </div>
        <span className="brand-name">EstateFlow <span className="brand-badge">PRO</span></span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Main Menu</span>
          {NAV_ITEMS.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-section" style={{ marginTop: 'auto' }}>
          <span className="nav-section-title">System</span>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          <button onClick={logout} className="sidebar-link logout-btn">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
