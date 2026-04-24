import { Card } from '../components/ui';
import { RecentLeads } from '../components/dashboard/RecentLeads';
import { SalesChart } from '../components/dashboard/SalesChart';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <h1 className="page-title">Dashboard</h1>
      <div className="dashboard-grid">
        <Card title="Sales Performance">
          <SalesChart />
        </Card>
        <Card title="Recent Leads">
          <RecentLeads />
        </Card>
        <Card title="Upcoming Tasks">
          <UpcomingTasks />
        </Card>
      </div>
    </div>
  );
}
