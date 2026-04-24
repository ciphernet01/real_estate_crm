import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { Card, Spinner } from '../components/ui';
import { RecentLeads } from '../components/dashboard/RecentLeads';
import { SalesChart } from '../components/dashboard/SalesChart';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { api } from '../services/api';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => {
      const { data } = await api.get('/reports/overview');
      return data.data;
    },
  });

  if (isLoading) return <div className="loading-state"><Spinner size={40} /></div>;

  return (
    <div className="industrial-dashboard">
      <header className="dashboard-header">
        <div className="header-meta">
          <h1 className="header-title">Executive Overview</h1>
          <div className="live-status">
            <span className="pulse-dot"></span>
            LIVE MONITORING
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline"><Clock size={16} /> Last 30 Days</button>
          <button className="btn btn-primary">Export Report</button>
        </div>
      </header>

      {/* High Density KPI Strip */}
      <div className="kpi-grid">
        <StatItem 
          label="Total Revenue" 
          value={formatCurrency(overview?.totalCommission || 0)} 
          trend="+12.5%" 
          up={true}
          icon={TrendingUp}
          color="#4f63ff"
        />
        <StatItem 
          label="Active Leads" 
          value={overview?.leadTotal || 0} 
          trend="+4.2%" 
          up={true}
          icon={Activity}
          color="#34d399"
        />
        <StatItem 
          label="Deals Closed" 
          value={overview?.closedDeals || 0} 
          trend="-2.1%" 
          up={false}
          icon={CheckCircle2}
          color="#f59e0b"
        />
        <StatItem 
          label="Avg. Conversion" 
          value={`${overview?.leadConversionRate || 0}%`} 
          trend="+0.8%" 
          up={true}
          icon={Users}
          color="#60a5fa"
        />
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-section">
          <Card title="Revenue Velocity" cardClassName="industrial-card">
            <SalesChart />
          </Card>
        </div>
        
        <div className="activity-section">
          <Card title="High-Priority Tasks" cardClassName="industrial-card">
            <UpcomingTasks />
          </Card>
        </div>

        <div className="leads-section">
          <Card title="Incoming Pipeline" cardClassName="industrial-card">
            <RecentLeads />
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, trend, up, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <div className="stat-row">
          <span className="stat-value">{value}</span>
          <span className={`stat-trend ${up ? 'up' : 'down'}`}>
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}
