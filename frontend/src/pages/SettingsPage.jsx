import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useToastStore } from '../store/toastStore.js';
import { Spinner } from '../components/ui/Spinner.jsx';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState('HUB'); // HUB, PERFORMANCE, ADMIN
  const currentUser = useAuthStore((state) => state.user);
  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const pendingQuery = useQuery({
    queryKey: ['pending-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/communications/notifications/pending?windowHours=24');
      return data.data;
    },
  });

  const performanceQuery = useQuery({
    queryKey: ['agent-performance'],
    queryFn: async () => {
      const { data } = await api.get('/agents/performance');
      return data.data;
    },
    enabled: isManagerOrAdmin,
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => await api.post('/communications/notifications/dispatch'),
    onSuccess: async (result) => {
      addToast({ message: `Successfully dispatched ${result.data.processed} notifications` });
      await queryClient.invalidateQueries({ queryKey: ['pending-notifications'] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }) => await api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      addToast({ message: 'User privileges updated' });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
    },
  });

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>System Management</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Configure integrations, monitor team velocity, and manage access controls</p>
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {['HUB', 'PERFORMANCE', 'ADMIN'].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', background: activeTab === t ? 'white' : 'transparent', color: activeTab === t ? '#6366f1' : '#64748b', boxShadow: activeTab === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'HUB' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          <article className="premium-card">
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>Notification Engine</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '16px', border: '1px solid #e0f2fe' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0369a1' }}>PENDING FOLLOW-UPS</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: '#0c4a6e' }}>{pendingQuery.data?.upcomingCount || 0}</strong>
              </div>
              <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#b91c1c' }}>OVERDUE ALERTS</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: '#7f1d1d' }}>{pendingQuery.data?.overdueCount || 0}</strong>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Dispatching will trigger automated reminders via configured SMS/Email hooks for all due interactions.</p>
            <button 
              onClick={() => dispatchMutation.mutate()}
              disabled={dispatchMutation.isPending}
              className="nav-link-pill active"
              style={{ border: 'none', cursor: 'pointer', width: '100%' }}
            >
              {dispatchMutation.isPending ? 'Processing Queue...' : 'Force Dispatch Follow-ups'}
            </button>
          </article>

          <article className="premium-card">
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>Infrastructure Settings</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { label: 'Database Node', val: 'Primary Cluster (Ready)', status: 'online' },
                { label: 'Portal Sync', val: 'Webhook Mode', status: 'online' },
                { label: 'Lead Capture', val: 'v2 Proxy Active', status: 'online' }
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{i.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{i.val}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                External integrators should target the <code>/integrations/capture</code> endpoint with a valid <code>X-CRM-Secret</code> header for secure lead ingestion.
              </p>
            </div>
          </article>
        </div>
      )}

      {activeTab === 'PERFORMANCE' && (
        <article className="premium-card">
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>Agent Productivity Ledger</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>AGENT</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>LEADS</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>CLOSED</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>PENDING TASKS</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textAlign: 'right' }}>TOTAL REVENUE</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.85rem' }}>
                {performanceQuery.data?.map(agent => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600 }}>{agent.name}</td>
                    <td style={{ padding: '16px 8px' }}>{agent.assignedLeads}</td>
                    <td style={{ padding: '16px 8px' }}>{agent.closedLeads}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ color: agent.overdueTasks > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
                        {agent.pendingTasks} {agent.overdueTasks > 0 && `(${agent.overdueTasks} overdue)`}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 700, color: '#6366f1' }}>${Number(agent.closedCommission || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {activeTab === 'ADMIN' && (
        <article className="premium-card">
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>Account & Access Control</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px' }}>System-wide user role assignments and security auditing.</p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {currentUser?.role === 'ADMIN' ? (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Administrative functions only available via secure terminal commands for added safety.</p>
            ) : (
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center', color: '#94a3b8' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '12px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Unauthorized Access: Admin privileges required to manage team accounts.</p>
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

