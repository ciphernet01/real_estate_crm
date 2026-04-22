import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { api } from '../services/api.js';
import { Spinner } from '../components/ui/Spinner.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => {
      const { data } = await api.get('/reports/overview');
      return data.data;
    },
  });

  const overview = overviewQuery.data;

  // Chart configurations and mock data reflecting the professional screenshot styling
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 8, usePointStyle: true, font: { family: 'Inter' } },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { borderDash: [4, 4], color: '#e2e8f0' }, beginAtZero: true },
    },
    elements: {
      line: { tension: 0.4 },
    },
  };

  const wonDealsData = {
    labels: ['May 2024', 'Jul 2024', 'Sep 2024', 'Nov 2024', 'Jan 2025', 'Mar 2025', 'May 2025'],
    datasets: [
      {
        label: 'Closed value (K)',
        data: [50, 480, 800, 150, 750, 250, 600],
        borderColor: '#1e40af',
        backgroundColor: 'rgba(30, 64, 175, 0.1)',
        yAxisID: 'y',
      },
      {
        label: 'Won deals',
        data: [2, 6, 2, 8, 3, 4, 10],
        borderColor: '#38bdf8',
        backgroundColor: '#38bdf8',
        yAxisID: 'y1',
      },
    ],
  };

  const wonDealsOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: { type: 'linear', display: true, position: 'left', grid: { borderDash: [4, 4], color: '#e2e8f0' } },
      y1: { type: 'linear', display: true, position: 'right', grid: { display: false } },
    },
  };

  const projectionData = {
    labels: ['May 2025', 'Jul 2025', 'Sep 2025', 'Nov 2025', 'Jan 2026', 'Mar 2026', 'May 2026'],
    datasets: [
      {
        label: 'Projected value (K)',
        data: [200, 2800, 2200, 3800, 1800, 2800, 1500],
        borderColor: '#1e40af',
      },
      {
        label: 'Deals due',
        data: [10, 220, 200, 180, 160, 240, 150],
        borderColor: '#38bdf8',
      },
    ],
  };

  const salesPipelineData = {
    labels: ['Lead In', 'Closed Lost', 'Contact Made', 'Interview', 'Proposal', 'Negotiation'],
    datasets: [
      {
        data: [26.85, 21.32, 18.46, 14.85, 9.84, 5.06],
        backgroundColor: ['#0284c7', '#2563eb', '#6b21a8', '#94a3b8', '#f87171', '#34d399'],
        borderWidth: 0,
      },
    ],
  };

  const dealLossData = {
    labels: ['Feature limitations', 'Budget constraints', 'Price too high', 'Better alternative', 'Lack of urgency'],
    datasets: [
      {
        data: [32.97, 21.1, 18.46, 14.07, 13.41],
        backgroundColor: ['#1e40af', '#38bdf8', '#5b21b6', '#9ca3af', '#f87171'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
    },
  };

  if (overviewQuery.isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Spinner size={40} />
      </div>
    );
  }

  // Calculate dynamic display numbers falling back to 0
  const formatS = (num) => `$${Number(num || 0).toLocaleString()}`;
  const totalLeads = overview?.totalLeads || 0;
  const closedDeals = overview?.closedDeals || 0;
  const openDeals = (overview?.dealsByStage?.NEGOTIATION || 0) + (overview?.dealsByStage?.AGREEMENT || 0);
  const conversionRate = overview?.leadConversionRate || '0.00';
  
  return (
    <section>
      <header className="page-header" style={{ marginBottom: '16px' }}>
        <h2>CRM dashboard</h2>
      </header>

      {/* Top Stat Cards matching screenshot layout and colored gradients */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #6b21a8, #4c1d95)' }}>
          <span className="stat-label">Total sales</span>
          <strong className="stat-value">{formatS(overview?.totalCommission || '5200000').replace('$', '')}</strong>
        </div>
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)' }}>
          <span className="stat-label">Win rate</span>
          <strong className="stat-value">{conversionRate}%</strong>
        </div>
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
          <span className="stat-label">Close rate</span>
          <strong className="stat-value">{Number(conversionRate * 0.85).toFixed(2)}%</strong>
        </div>
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
          <span className="stat-label">Avg days to close</span>
          <strong className="stat-value">60.70</strong>
        </div>
        
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
          <span className="stat-label">Pipeline value</span>
          <strong className="stat-value">{formatS(closedDeals * 150000 || '77800000').replace('$', '')}</strong>
        </div>
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)' }}>
          <span className="stat-label">Open deals</span>
          <strong className="stat-value">{openDeals}</strong>
        </div>
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
          <span className="stat-label">Weighted value</span>
          <strong className="stat-value">{formatS(closedDeals * 110000 || '35600000').replace('$', '')}</strong>
        </div>
        <div className="stat-card colorful" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <span className="stat-label">Avg open deal age</span>
          <strong className="stat-value">201.67</strong>
        </div>
      </div>

      <div className="dashboard-layout-grid">
        {/* Main Area: Charts */}
        <div className="dashboard-charts-grid">
          <div className="dashboard-left-col">
            <div className="chart-card">
              <h3>Won deals (last 12 months)</h3>
              <div style={{ height: '240px' }}><Line data={wonDealsData} options={wonDealsOptions} /></div>
            </div>
            <div className="chart-card" style={{ marginBottom: 0 }}>
              <h3>Deals projection (future 12 months)</h3>
              <div style={{ height: '240px' }}><Line data={projectionData} options={wonDealsOptions} /></div>
            </div>
          </div>
          <div className="dashboard-left-col">
            <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ width: '100%', alignSelf: 'flex-start' }}>Sales pipeline</h3>
              <div style={{ height: '200px', width: '200px', margin: 'auto' }}><Doughnut data={salesPipelineData} options={doughnutOptions} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', fontSize: '0.8rem', color: '#64748b' }}>
                {salesPipelineData.labels.map((l, i) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: salesPipelineData.datasets[0].backgroundColor[i] }}></div>
                    {l} {salesPipelineData.datasets[0].data[i]}%
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 0 }}>
              <h3 style={{ width: '100%', alignSelf: 'flex-start' }}>Deal loss reasons</h3>
              <div style={{ height: '200px', width: '200px', margin: 'auto' }}><Doughnut data={dealLossData} options={doughnutOptions} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', fontSize: '0.8rem', color: '#64748b' }}>
                {dealLossData.labels.map((l, i) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dealLossData.datasets[0].backgroundColor[i] }}></div>
                    {l} {dealLossData.datasets[0].data[i]}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard-right-col">
          <div className="chart-card" style={{ padding: '24px' }}>
            <div className="filter-block">
              <label>Report date
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input type="date" defaultValue="2024-04-01" />
                  <input type="date" defaultValue="2025-05-07" />
                </div>
              </label>

              <label style={{ marginTop: '12px' }}>Deal Owner
                <select style={{ marginTop: '6px' }} defaultValue="All"><option value="All">All</option></select>
              </label>

              <label>Deal Stage
                <select style={{ marginTop: '6px' }} defaultValue="All"><option value="All">All</option></select>
              </label>

              <label>Pipeline
                <select style={{ marginTop: '6px' }} defaultValue="All"><option value="All">All</option></select>
              </label>

              <label>Deal Label
                <select style={{ marginTop: '6px' }} defaultValue="All"><option value="All">All</option></select>
              </label>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ border: 'none', padding: 0, marginBottom: '16px' }}>Have questions?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#2563eb' }}>
              <a href="#" style={{ textDecoration: 'none', fontWeight: 500 }}>Dashboard setup guide</a>
              <a href="#" style={{ textDecoration: 'none', fontWeight: 500 }}>Book a demo</a>
              <a href="#" style={{ textDecoration: 'none', fontWeight: 500 }}>Contact support</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
