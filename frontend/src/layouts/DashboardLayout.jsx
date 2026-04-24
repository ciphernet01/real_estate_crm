import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar, Topbar } from '../components/layout';
import { useAuth } from '../contexts/auth';

export default function DashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="enterprise-layout">
      <Sidebar />
      <div className="enterprise-content">
        <Topbar />
        <main className="enterprise-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
