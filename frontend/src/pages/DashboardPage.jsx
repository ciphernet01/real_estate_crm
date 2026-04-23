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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
];

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => {
      const { data } = await api.get('/reports/overview');
      return data.data;
    },
  });

  const propertiesQuery = useQuery({
    queryKey: ['properties-recent'],
    queryFn: async () => {
      const { data } = await api.get('/properties');
      return data.data.slice(0, 4);
    },
  });

  const overview = overviewQuery.data;
  const recentProperties = propertiesQuery.data || [];

  const mainChartData = {
    labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    datasets: [
      {
        label: 'Monthly Earnings',
        data: [3500, 4200, 3800, 5100, 4800, 6200, 7580, 7100, 8400, 9200, 10500, 11750],
        borderColor: '#4f46e5',
        backgroundColor: (context) => {
          const bg = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
          bg.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
          bg.addColorStop(1, 'rgba(79, 70, 229, 0)');
          return bg;
        },
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#4f46e5',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
      {
        label: 'Active Leads',
        data: [2100, 2800, 3200, 2900, 3800, 4500, 4100, 4900, 5200, 5800, 6500, 7200],
        borderColor: '#06b6d4',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: 12,
        titleFont: { size: 14, weight: '700', family: 'Outfit' },
        bodyFont: { size: 13, family: 'Inter' },
        cornerRadius: 8,
        displayColors: false,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { font: { size: 11, weight: '600' }, color: '#94a3b8' } 
      },
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }, 
        ticks: { font: { size: 11 }, color: '#94a3b8', callback: (v) => `$${v}` } 
      },
    },
  };

  if (overviewQuery.isLoading) {
    return <div className="dashboard-loading"><Spinner size={40} /></div>;
  }

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      {/* Top KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <article className="premium-card gradient-card card-vibrant-purple">
          <div className="stat-header">
            <span className="stat-title">ACTIVE PROPERTIES</span>
            <div className="stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            </div>
          </div>
          <div className="stat-huge-value">{overview?.totalProperties || 128}</div>
        </article>

        <article className="premium-card gradient-card card-vibrant-pink">
          <div className="stat-header">
            <span className="stat-title">NEW LEADS</span>
            <div className="stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            </div>
          </div>
          <div className="stat-huge-value">{overview?.totalLeads || 25}</div>
        </article>

        <article className="premium-card gradient-card card-vibrant-indigo">
          <div className="stat-header">
            <span className="stat-title">TOTAL CLIENTS</span>
            <div className="stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <div className="stat-huge-value">{overview?.totalLeads + overview?.closedDeals || 350}</div>
        </article>

        <article className="premium-card gradient-card card-vibrant-teal">
          <div className="stat-header">
            <span className="stat-title">PENDING TOURS</span>
            <div className="stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>
          <div className="stat-huge-value">{overview?.dealsByStage?.NEGOTIATION || 5}</div>
        </article>
      </div>

      {/* Main Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Sales Summary Chart & High-Value KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
            <article className="premium-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Sales Summary</h3>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>MONTHLY EARNINGS</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>ACTIVE LEADS</span>
                  </div>
                </div>
                <div style={{ color: '#4f46e5', fontWeight: 800, fontSize: '1.1rem' }}>Total: $11,750</div>
              </div>
              <div style={{ flex: 1 }}>
                <Line data={mainChartData} options={chartOptions} />
              </div>
            </article>

            <div style={{ display: 'grid', gap: '20px' }}>
              <article className="premium-card" style={{ background: '#f8fafc' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PENDING TOURS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                  <strong style={{ fontSize: '1.75rem', fontWeight: 800 }}>$78,920</strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    12%
                  </span>
                </div>
                {/* Visual Placeholder for trend line */}
                <div style={{ height: '40px', marginTop: '12px', background: 'linear-gradient(90deg, #eef2ff, transparent)', borderRadius: '4px' }}></div>
              </article>

              <article className="premium-card">
                <h4 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 700 }}>Monthly Properties</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Closed Deals</span>
                    <strong style={{ fontSize: '0.9rem' }}>$750,000</strong>
                    <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>+ 33%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Open Deals</span>
                    <strong style={{ fontSize: '0.9rem' }}>$420,000</strong>
                    <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>+ 25%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', marginTop: '8px' }}>
                    <div style={{ width: '75%', height: '100%', background: 'var(--gradient-indigo)', borderRadius: '2px' }}></div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          {/* Interactive Portfolio Map Hub */}
          <article className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Portfolio Map Hub</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Geospatial distribution of active inventory</p>
              </div>
              <button 
                onClick={() => window.location.href='/properties'}
                className="nav-link-pill active" 
                style={{ fontSize: '0.7rem', padding: '6px 12px', border: 'none', cursor: 'pointer' }}
              >
                Expand Analysis
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr', height: '400px' }}>
              <div style={{ background: '#020617', position: 'relative', overflow: 'hidden' }}>
                {/* Simplified Mock Map Background */}
                <svg width="100%" height="100%" viewBox="0 0 800 600" style={{ opacity: 0.15 }}>
                  <path d="M100,100 L300,150 L500,100 L700,200 L750,500 L600,550 L300,500 L100,450 Z" fill="#6366f1" />
                  <path d="M200,300 L400,350 L600,300 L550,450 L350,500 L250,450 Z" fill="#4f46e5" />
                </svg>
                {/* Interactive Pins */}
                {[
                  { top: '30%', left: '40%', price: '$1.2M' },
                  { top: '60%', left: '70%', price: '$850k' },
                  { top: '45%', left: '20%', price: '$2.1M' },
                  { top: '80%', left: '35%', price: '$590k' }
                ].map((pin, i) => (
                  <div key={i} style={{ 
                    position: 'absolute', top: pin.top, left: pin.left, transform: 'translate(-50%, -100%)', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <div style={{ 
                      background: 'rgba(99, 102, 241, 0.9)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, marginBottom: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      {pin.price}
                    </div>
                    <div style={{ width: '12px', height: '12px', background: '#6366f1', borderRadius: '50%', border: '2px solid white', margin: '0 auto', boxShadow: '0 0 15px #6366f1' }}></div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.5)', borderLeft: '1px solid var(--border-glass)', display: 'grid', gap: '20px', alignContent: 'start' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>HOTSPOT ANALYSIS</span>
                  <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                    {[
                      { area: 'Downtown Core', count: 12, growth: '+24%' },
                      { area: 'Waterfront', count: 8, growth: '+12%' },
                      { area: 'Suburban North', count: 24, growth: '+5%' }
                    ].map(region => (
                      <div key={region.area} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{region.area}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                           <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc' }}>{region.count}</span>
                           <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2dd4bf' }}>{region.growth}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>INVENTORY HEALTH</span>
                  <div style={{ height: '8px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '4px', overflow: 'hidden', margin: '12px 0 8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ width: '85%', height: '100%', background: 'var(--gradient-indigo)' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8' }}>85% Utilization across priority zones</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Sidebar Lists */}
        <div style={{ display: 'grid', gap: '20px' }}>
          <article className="premium-card">
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>New Leads</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { name: 'Alex Patel', status: 'Property Inquiry' },
                { name: 'Tamanna Roy', status: 'Viewing Scheduled' },
                { name: 'Rohit Verma', status: 'Offer Pending' },
                { name: 'Priya Gupta', status: 'New Lead' }
              ].map((lead, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eef2ff', display: 'grid', placeItems: 'center', color: '#4f46e5', fontWeight: 700, fontSize: '0.75rem' }}>
                    {lead.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>{lead.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{lead.status}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              ))}
            </div>
          </article>

          <article className="premium-card">
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>Schedule</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { time: '10:00 AM', event: 'Property Emilia Clark', type: 'Viewing' },
                { time: '02:30 PM', event: 'Call Raunaq Sharma', type: 'Negotiation' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', borderLeft: '3px solid #4f46e5' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4f46e5' }}>{item.time}</span>
                  <strong style={{ display: 'block', fontSize: '0.8rem', margin: '2px 0' }}>{item.event}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.type}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

      </div>
    </div>
  );
}
