import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/auth';

export default function PublicLayout() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="enterprise-public-layout">
      <Outlet />
    </div>
  );
}
