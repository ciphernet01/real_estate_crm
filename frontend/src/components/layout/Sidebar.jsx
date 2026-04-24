import { NavLink } from 'react-router-dom';
import { Building, DollarSign, Home, Settings, Users } from 'lucide-react';

const navLinks = [
  { icon: Home, text: 'Dashboard', path: '/' },
  { icon: Users, text: 'Agents', path: '/agents' },
  { icon: Building, text: 'Leads', path: '/leads' },
  { icon: DollarSign, text: 'Deals', path: '/deals' },
];

export default function Sidebar() {
  return (
    <div className="enterprise-sidebar">
      <div className="enterprise-sidebar-header">
        <DollarSign className="enterprise-logo" />
        <h1 className="enterprise-brand">Real Estate</h1>
      </div>
      <nav className="enterprise-sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.text}
            to={link.path}
            className={({ isActive }) =>
              `enterprise-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <link.icon className="enterprise-nav-icon" />
            <span className="enterprise-nav-text">{link.text}</span>
          </NavLink>
        ))}
      </nav>
      <div className="enterprise-sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `enterprise-nav-link ${isActive ? 'active' : ''}`
          }
        >
          <Settings className="enterprise-nav-icon" />
          <span className="enterprise-nav-text">Settings</span>
        </NavLink>
      </div>
    </div>
  );
}
