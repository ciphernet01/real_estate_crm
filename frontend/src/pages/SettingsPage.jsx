import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useToastStore } from '../store/toastStore.js';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'AGENT' });
  const [taskForm, setTaskForm] = useState({ leadId: '', agentId: '', title: '', dueAt: '' });
  const [syncForm, setSyncForm] = useState({ propertyId: '', portal: 'CUSTOM' });
  const [errorText, setErrorText] = useState('');
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ADMIN';
  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const pendingQuery = useQuery({
    queryKey: ['pending-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/communications/notifications/pending?windowHours=24');
      return data.data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/users');
        return data.data;
      } catch {
        return [];
      }
    },
    enabled: isManagerOrAdmin,
  });

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await api.get('/auth/agents');
      return data.data;
    },
  });

  const leadsQuery = useQuery({
    queryKey: ['settings-leads'],
    queryFn: async () => {
      const { data } = await api.get('/leads');
      return data.data;
    },
  });

  const propertiesQuery = useQuery({
    queryKey: ['settings-properties'],
    queryFn: async () => {
      const { data } = await api.get('/properties');
      return data.data;
    },
  });

  const integrationStatusQuery = useQuery({
    queryKey: ['integration-status'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/integrations/status');
        return data.data;
      } catch {
        return null;
      }
    },
    enabled: isManagerOrAdmin,
  });

  const deepHealthQuery = useQuery({
    queryKey: ['deep-health'],
    queryFn: async () => {
      const { data } = await api.get('/health/deep');
      return data;
    },
    refetchInterval: 30000,
  });

  const performanceQuery = useQuery({
    queryKey: ['agent-performance'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/agents/performance');
        return data.data;
      } catch {
        return [];
      }
    },
    enabled: isManagerOrAdmin,
  });

  const myTasksQuery = useQuery({
    queryKey: ['agent-my-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/agents/tasks?mine=true');
      return data.data;
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/communications/notifications/dispatch');
      return data.data;
    },
    onSuccess: async (result) => {
      setDispatchMessage(`Dispatched ${result.processed} follow-up notification(s).`);
      addToast({ message: `${result.processed} notification(s) dispatched` });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pending-notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['timeline'] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Dispatch failed');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await api.post('/users', userForm);
    },
    onSuccess: async () => {
      setUserForm({ name: '', email: '', password: '', role: 'AGENT' });
      setErrorText('');
      addToast({ message: 'User created' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['agents'] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to create user');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      await api.patch(`/users/${userId}/role`, { role });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['agents'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-performance'] }),
      ]);
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: async () => {
      await api.post('/agents/tasks/assign', taskForm);
    },
    onSuccess: async () => {
      setTaskForm({ leadId: '', agentId: '', title: '', dueAt: '' });
      setErrorText('');
      addToast({ message: 'Task assigned' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-my-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-performance'] }),
        queryClient.invalidateQueries({ queryKey: ['pending-notifications'] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to assign task');
    },
  });

  const portalSyncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/integrations/portal-sync/property', syncForm);
      return data.data;
    },
    onSuccess: (result) => {
      setDispatchMessage(`Portal sync completed (${result.mode}) for property ${result.propertyId}.`);
      setSyncForm({ propertyId: '', portal: 'CUSTOM' });
      setErrorText('');
      addToast({ message: 'Portal sync completed' });
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Portal sync failed');
    },
  });

  return (
    <section>
      <header className="page-header">
        <h2>Settings</h2>
        <p>Notification controls, RBAC user management, and agent performance dashboard.</p>
      </header>

      {errorText ? <div className="error-banner" style={{ marginBottom: 16 }}>{errorText}</div> : null}

      <div className="panel-grid">
        <div className="form-card">
          <h3>Notification Engine</h3>
          <div className="form-grid single-col">
            <div>
              <strong>Overdue:</strong> {pendingQuery.data?.overdueCount || 0}
            </div>
            <div>
              <strong>Due in 24h:</strong> {pendingQuery.data?.upcomingCount || 0}
            </div>
          </div>
          <button type="button" onClick={() => dispatchMutation.mutate()} disabled={dispatchMutation.isPending}>
            {dispatchMutation.isPending ? 'Dispatching...' : 'Dispatch Due Follow-ups'}
          </button>
          {dispatchMessage ? <div className="muted-line">{dispatchMessage}</div> : null}
        </div>

        <div className="form-card">
          <h3>Integration Notes</h3>
          <div className="form-grid single-col">
            <div><strong>System Health:</strong> {deepHealthQuery.data?.ok ? 'healthy' : 'checking'}</div>
            <div><strong>Database:</strong> {deepHealthQuery.data?.database || 'unknown'}</div>
            <div>Configure backend env for webhook-based providers:</div>
            <div><strong>SMS_WEBHOOK_URL</strong></div>
            <div><strong>EMAIL_WEBHOOK_URL</strong></div>
            <div><strong>NOTIFICATION_FROM</strong></div>
            <div><strong>INTEGRATION_WEBHOOK_SECRET</strong></div>
            <div><strong>PORTAL_SYNC_WEBHOOK_URL</strong></div>
            <div className="muted-line">These can target Twilio/SendGrid adapters, n8n, or any internal webhook worker.</div>
            {isManagerOrAdmin && integrationStatusQuery.data ? (
              <>
                <div><strong>Lead Webhook:</strong> {integrationStatusQuery.data.leadWebhookEnabled ? 'enabled' : 'disabled'}</div>
                <div><strong>Webhook Secret:</strong> {integrationStatusQuery.data.webhookSecretConfigured ? 'configured' : 'missing'}</div>
                <div><strong>Portal Sync:</strong> {integrationStatusQuery.data.portalSyncWebhookConfigured ? 'configured' : 'dry-run mode'}</div>
              </>
            ) : null}
          </div>

          {isManagerOrAdmin ? (
            <form
              className="form-grid single-col"
              onSubmit={(event) => {
                event.preventDefault();
                portalSyncMutation.mutate();
              }}
            >
              <label>
                Property to sync
                <select value={syncForm.propertyId} onChange={(event) => setSyncForm((current) => ({ ...current, propertyId: event.target.value }))}>
                  <option value="">Select property</option>
                  {(propertiesQuery.data || []).map((property) => (
                    <option value={property.id} key={property.id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Portal
                <select value={syncForm.portal} onChange={(event) => setSyncForm((current) => ({ ...current, portal: event.target.value }))}>
                  <option value="CUSTOM">CUSTOM</option>
                  <option value="MAGICBRICKS">MAGICBRICKS</option>
                  <option value="99ACRES">99ACRES</option>
                  <option value="HOUSING">HOUSING</option>
                </select>
              </label>
              <button type="submit" disabled={!syncForm.propertyId || portalSyncMutation.isPending}>
                {portalSyncMutation.isPending ? 'Syncing...' : 'Sync Property to Portal'}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {isManagerOrAdmin ? (
        <div className="panel-grid" style={{ marginTop: 18 }}>
          <div className="form-card">
            <h3>Agent Performance</h3>
            <div className="table-card" style={{ border: 0, boxShadow: 'none', background: 'transparent' }}>
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Leads</th>
                    <th>Closed</th>
                    <th>Conv%</th>
                    <th>Open Deals</th>
                    <th>Commission</th>
                    <th>Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {(performanceQuery.data || []).map((agent) => (
                    <tr key={agent.id}>
                      <td>{agent.name}</td>
                      <td>{agent.assignedLeads}</td>
                      <td>{agent.closedLeads}</td>
                      <td>{agent.conversionRate}%</td>
                      <td>{agent.openDeals}</td>
                      <td>${Number(agent.closedCommission || 0).toLocaleString()}</td>
                      <td>{agent.pendingTasks} ({agent.overdueTasks} overdue)</td>
                    </tr>
                  ))}
                  {!performanceQuery.isLoading && (performanceQuery.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={7}>No agent performance data</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <form
            className="form-card"
            onSubmit={(event) => {
              event.preventDefault();
              assignTaskMutation.mutate();
            }}
          >
            <h3>Task Assignment</h3>
            <div className="form-grid single-col">
              <label>
                Lead
                <select value={taskForm.leadId} onChange={(event) => setTaskForm((current) => ({ ...current, leadId: event.target.value }))}>
                  <option value="">Select lead</option>
                  {(leadsQuery.data || []).map((lead) => (
                    <option value={lead.id} key={lead.id}>
                      {lead.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assign to
                <select value={taskForm.agentId} onChange={(event) => setTaskForm((current) => ({ ...current, agentId: event.target.value }))}>
                  <option value="">Select agent</option>
                  {(agentsQuery.data || []).map((agent) => (
                    <option value={agent.id} key={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Task title
                <input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                Due at
                <input type="datetime-local" value={taskForm.dueAt} onChange={(event) => setTaskForm((current) => ({ ...current, dueAt: event.target.value }))} />
              </label>
            </div>
            <button type="submit" disabled={!taskForm.leadId || !taskForm.agentId || !taskForm.title || !taskForm.dueAt || assignTaskMutation.isPending}>
              {assignTaskMutation.isPending ? 'Assigning...' : 'Assign Task'}
            </button>
          </form>
        </div>
      ) : null}

      <div className="table-card" style={{ marginTop: 18, marginBottom: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Due</th>
              <th>Lead</th>
              <th>Status</th>
              <th>Task</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {(myTasksQuery.data || []).map((task) => (
              <tr key={task.id}>
                <td>{new Date(task.dueAt).toLocaleString()}</td>
                <td>{task.lead?.name || '-'}</td>
                <td>{task.lead?.status || '-'}</td>
                <td>{task.title}</td>
                <td>{task.lead?.assignedTo?.name || '-'}</td>
              </tr>
            ))}
            {!myTasksQuery.isLoading && (myTasksQuery.data || []).length === 0 ? (
              <tr>
                <td colSpan={5}>No active tasks assigned</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {isAdmin ? (
        <div className="panel-grid">
          <form
            className="form-card"
            onSubmit={(event) => {
              event.preventDefault();
              createUserMutation.mutate();
            }}
          >
            <h3>Create User</h3>
            <div className="form-grid single-col">
              <label>
                Name
                <input value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Email
                <input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label>
                Password
                <input type="password" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <label>
                Role
                <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="AGENT">AGENT</option>
                </select>
              </label>
            </div>
            <button type="submit" disabled={!userForm.name || !userForm.email || !userForm.password || createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </form>

          <div className="form-card">
            <h3>User Roles</h3>
            <div className="table-card" style={{ border: 0, boxShadow: 'none', background: 'transparent' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersQuery.data || []).map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(event) => updateRoleMutation.mutate({ userId: user.id, role: event.target.value })}
                          disabled={updateRoleMutation.isPending || user.id === currentUser?.id}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="AGENT">AGENT</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!usersQuery.isLoading && (usersQuery.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={4}>No users found</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

