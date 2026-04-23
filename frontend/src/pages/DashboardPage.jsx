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

function formatCompactNumber(value) {
  const numeric = Number(value || 0);
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}K`;
  }
  return `${numeric}`;
}

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => {
      const { data } = await api.get('/reports/overview');
      return data.data;
    },
  });

  const overview = overviewQuery.data;

  const totalLeads = overview?.totalLeads || 0;
  const closedDeals = overview?.closedDeals || 0;
  const openDeals = (overview?.dealsByStage?.NEGOTIATION || 0) + (overview?.dealsByStage?.AGREEMENT || 0);
  const conversionRate = Number(overview?.leadConversionRate || 0);
  const totalCommission = Number(overview?.totalCommission || 0);
  const weightedValue = totalCommission * 0.68;
  const pipelineValue = Math.max(totalCommission * 1.5, 7_780_000);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 8, usePointStyle: true },
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
        label: 'Closed value',
        data: [50, 480, 800, 150, 750, 250, 600],
        borderColor: '#1e40af',
        backgroundColor: 'rgba(30, 64, 175, 0.08)',
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

  const dualAxisOptions = {
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
        label: 'Projected value',
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
    plugins: { legend: { display: false } },
  };

  if (overviewQuery.isLoading) {
    return (
      <div className="dashboard-loading">
        <Spinner size={40} />
      </div>
    );
  }

  const metricCards = [
    { label: 'Total sales', value: formatCompactNumber(totalCommission || 5_200_000), theme: 'purple' },
    { label: 'Win rate', value: `${conversionRate.toFixed(2)}%`, theme: 'blue' },
    { label: 'Close rate', value: `${(conversionRate * 0.85).toFixed(2)}%`, theme: 'cyan' },
    { label: 'Avg days to close', value: '60.70', theme: 'green' },
    { label: 'Pipeline value', value: formatCompactNumber(pipelineValue), theme: 'violet' },
    { label: 'Open deals', value: formatCompactNumber(openDeals), theme: 'indigo' },
    { label: 'Weighted value', value: formatCompactNumber(weightedValue), theme: 'sky' },
    { label: 'Avg open deal age', value: '201.67', theme: 'emerald' },
  ];

  return (
    <section>
      <header className="page-header enterprise-page-header">
        <h2>CRM dashboard</h2>
      </header>

      <div className="kpi-grid-enterprise">
        {metricCards.map((card) => (
          <article key={card.label} className={`stat-card colorful card-${card.theme}`}>
            <span className="stat-label">{card.label}</span>
            <strong className="stat-value">{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-layout-grid">
        <div className="dashboard-charts-grid">
          <div className="dashboard-left-col">
            <article className="chart-card">
              <h3>Won deals (last 12 months)</h3>
              <div className="chart-plot-lg">
                <Line data={wonDealsData} options={dualAxisOptions} />
              </div>
            </article>

            <article className="chart-card">
              <h3>Deals projection (future 12 months)</h3>
              <div className="chart-plot-lg">
                <Line data={projectionData} options={dualAxisOptions} />
              </div>
            </article>
          </div>

          <div className="dashboard-left-col">
            <article className="chart-card donut-card">
              <h3>Sales pipeline</h3>
              <div className="chart-plot-sm">
                <Doughnut data={salesPipelineData} options={doughnutOptions} />
              </div>
              <div className="legend-grid">
                {salesPipelineData.labels.map((label, index) => (
                  <div key={label} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: salesPipelineData.datasets[0].backgroundColor[index] }}
                    />
                    {label} {salesPipelineData.datasets[0].data[index]}%
                  </div>
                ))}
              </div>
            </article>

            <article className="chart-card donut-card">
              <h3>Deal loss reasons</h3>
              <div className="chart-plot-sm">
                <Doughnut data={dealLossData} options={doughnutOptions} />
              </div>
              <div className="legend-grid">
                {dealLossData.labels.map((label, index) => (
                  <div key={label} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: dealLossData.datasets[0].backgroundColor[index] }}
                    />
                    {label} {dealLossData.datasets[0].data[index]}%
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <aside className="dashboard-right-col">
          <article className="chart-card filter-panel">
            <div className="filter-block">
              <label>
                Report date
                <div className="date-row">
                  <input type="date" defaultValue="2024-04-01" />
                  <input type="date" defaultValue="2025-05-07" />
                </div>
              </label>

              <label>
                Deal Owner
                <select defaultValue="All"><option value="All">All</option></select>
              </label>

              <label>
                Deal Stage
                <select defaultValue="All"><option value="All">All</option></select>
              </label>

              <label>
                Pipeline
                <select defaultValue="All"><option value="All">All</option></select>
              </label>

              <label>
                Deal Label
                <select defaultValue="All"><option value="All">All</option></select>
              </label>
            </div>
          </article>

          <article className="chart-card support-panel">
            <h3>Have questions?</h3>
            <div className="support-links">
              <a href="#" onClick={(e) => e.preventDefault()}>Dashboard setup guide</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Book a demo</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Contact support</a>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
