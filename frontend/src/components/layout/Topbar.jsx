import { useAuth } from '../../contexts/auth';
import { ChevronDown, User } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <div className="enterprise-topbar">
      <div className="enterprise-topbar-left">
        {/* Add any top-bar actions here */}
      </div>
      <div className="enterprise-topbar-right">
        <div className="enterprise-user-menu">
          <User className="enterprise-user-avatar" />
          <div className="enterprise-user-details">
            <p className="enterprise-user-name">{user.name}</p>
            <p className="enterprise-user-role">{user.role}</p>
          </div>
          <ChevronDown className="enterprise-user-menu-arrow" />
          <div className="enterprise-user-menu-dropdown">
            <a href="#" className="enterprise-user-menu-item">Profile</a>
            <button onClick={logout} className="enterprise-user-menu-item">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}
