import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui';
import { RecentLeads } from '../components/dashboard/RecentLeads';
import { SalesChart } from '../components/dashboard/SalesChart';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { api } from '../services/api';
import { Spinner } from '../components/ui';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => {
      const { data } = await api.get('/reports/overview');
      return data.data;
    },
  });

  return (
    <div className="enterprise-main">
      <div className="enterprise-header">
        <div className="enterprise-header-left">
          <h1 className="enterprise-title">Dashboard</h1>
          <p className="enterprise-subtitle">Key metrics and performance at a glance</p>
        </div>
        <div className="enterprise-header-right">
          <div className="enterprise-pill-nav">
            <a href="#" className="enterprise-pill active">Overview</a>
            <a href="#" className="enterprise-pill">Analytics</a>
            <a href="#" className="enterprise-pill">Reports</a>
          </div>
        </div>
      </div>

      <div className="dashboard-layout-grid">
        {overviewQuery.isLoading ? (
          <Spinner />
        ) : (
          <div className="dashboard-summary-strip">
            <div className="summary-item">
              <p className="summary-item-title">Total Revenue</p>
              <p className="summary-item-value">{formatCurrency(overviewQuery.data?.totalCommission || 0)}</p>
            </div>
            <div className="summary-item">
              <p className="summary-item-title">New Leads</p>
              <p className="summary-item-value">{overviewQuery.data?.leadTotal || 0}</p>
            </div>
            <div className="summary-item">
              <p className="summary-item-title">Deals Closed</p>
              <p className="summary-item-value">{overviewQuery.data?.closedDeals || 0}</p>
            </div>
            <div className="summary-item">
              <p className="summary-item-title">Conversion Rate</p>
              <p className="summary-item-value">{overviewQuery.data?.leadConversionRate || 0}%</p>
            </div>
          </div>
        )}

        <div className="dashboard-charts-grid">
          <Card title="Sales Performance" cardClassName="h-full">
            <SalesChart />
          </Card>
          <Card title="Recent Leads" cardClassName="h-full">
            <RecentLeads />
          </Card>
        </div>

        <Card title="Upcoming Tasks">
          <UpcomingTasks />
        </Card>
      </div>
    </div>
  );
}
