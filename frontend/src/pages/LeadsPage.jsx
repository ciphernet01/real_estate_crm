import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';

const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'LOST'];

const nextStatusMap = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CLOSED', 'LOST'],
  CLOSED: [],
  LOST: [],
};

const initialForm = {
  name: '',
  email: '',
  phone: '',
  source: 'Website',
  budget: '',
  preferences: '',
  assignedToId: '',
};

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState(initialForm);
  const [activeLeadId, setActiveLeadId] = useState('');
  const [reminder, setReminder] = useState({ title: '', dueAt: '' });
  const [errorText, setErrorText] = useState('');

  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await api.get('/leads');
      return data.data;
    },
  });

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await api.get('/auth/agents');
      return data.data;
    },
  });

  const remindersQuery = useQuery({
    queryKey: ['lead-reminders'],
    queryFn: async () => {
      const { data } = await api.get('/leads/reminders/upcoming?days=7');
      return data.data;
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (payload) => {
      await api.post('/leads', payload);
    },
    onSuccess: async () => {
      setForm(initialForm);
      setErrorText('');
      addToast({ message: 'Lead created successfully' });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to create lead');
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      await api.patch(`/leads/${id}`, payload);
    },
    onSuccess: async () => {
      setErrorText('');
      addToast({ message: 'Lead updated' });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to update lead');
    },
  });

  const addReminderMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      await api.post(`/leads/${id}/reminders`, payload);
    },
    onSuccess: async () => {
      setReminder({ title: '', dueAt: '' });
      setErrorText('');
      addToast({ message: 'Reminder added' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['lead-reminders'] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to create reminder');
    },
  });

  const canSubmit = useMemo(() => form.name.trim().length > 1 && form.source.trim().length > 1, [form.name, form.source]);

  const submitLead = (event) => {
    event.preventDefault();

    createLeadMutation.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      source: form.source,
      budget: form.budget ? Number(form.budget) : undefined,
      preferences: form.preferences || undefined,
      assignedToId: form.assignedToId || undefined,
    });
  };

  const submitReminder = (event) => {
    event.preventDefault();
    if (!activeLeadId) {
      setErrorText('Select a lead before creating reminder');
      return;
    }

    addReminderMutation.mutate({
      id: activeLeadId,
      payload: {
        title: reminder.title,
        dueAt: reminder.dueAt,
      },
    });
  };

  return (
    <section>
      <header className="page-header">
        <h2>Leads</h2>
        <p>Manual lead capture, assignment, status workflow, and follow-up reminders.</p>
      </header>

      <div className="panel-grid">
        <form className="form-card" onSubmit={submitLead}>
          <h3>Add Lead</h3>
          <div className="form-grid">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </label>
            <label>
              Source
              <input value={form.source} onChange={(e) => setForm((current) => ({ ...current, source: e.target.value }))} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} />
            </label>
            <label>
              Budget
              <input type="number" min="0" value={form.budget} onChange={(e) => setForm((current) => ({ ...current, budget: e.target.value }))} />
            </label>
            <label>
              Assign to
              <select value={form.assignedToId} onChange={(e) => setForm((current) => ({ ...current, assignedToId: e.target.value }))}>
                <option value="">Auto-assign</option>
                {(agentsQuery.data || []).map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Preferences
              <input value={form.preferences} onChange={(e) => setForm((current) => ({ ...current, preferences: e.target.value }))} />
            </label>
          </div>
          <button type="submit" disabled={!canSubmit || createLeadMutation.isPending}>
            {createLeadMutation.isPending ? 'Saving...' : 'Create Lead'}
          </button>
        </form>

        <form className="form-card" onSubmit={submitReminder}>
          <h3>Follow-up Reminder</h3>
          <div className="form-grid single-col">
            <label>
              Lead
              <select value={activeLeadId} onChange={(e) => setActiveLeadId(e.target.value)}>
                <option value="">Select lead</option>
                {(leadsQuery.data || []).map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.status})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input value={reminder.title} onChange={(e) => setReminder((current) => ({ ...current, title: e.target.value }))} required />
            </label>
            <label>
              Due at
              <input type="datetime-local" value={reminder.dueAt} onChange={(e) => setReminder((current) => ({ ...current, dueAt: e.target.value }))} required />
            </label>
          </div>
          <button type="submit" disabled={!activeLeadId || addReminderMutation.isPending}>
            {addReminderMutation.isPending ? 'Saving...' : 'Add Reminder'}
          </button>
        </form>
      </div>

      {errorText ? <div className="error-banner" style={{ marginBottom: 16 }}>{errorText}</div> : null}

      <div className="table-card" style={{ marginBottom: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Source</th>
              <th>Budget</th>
              <th>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {(leadsQuery.data || []).map((lead) => {
              const nextStatuses = nextStatusMap[lead.status] || [];

              return (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={(event) =>
                        updateLeadMutation.mutate({
                          id: lead.id,
                          payload: { status: event.target.value },
                        })
                      }
                    >
                      <option value={lead.status}>{lead.status}</option>
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{lead.source}</td>
                  <td>{lead.budget ? `$${Number(lead.budget).toLocaleString()}` : '-'}</td>
                  <td>{lead.assignedTo?.name || 'Unassigned'}</td>
                </tr>
              );
            })}
            {!leadsQuery.isLoading && (leadsQuery.data || []).length === 0 ? (
              <tr>
                <td colSpan={5}>No leads found</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Due</th>
              <th>Lead</th>
              <th>Status</th>
              <th>Reminder</th>
            </tr>
          </thead>
          <tbody>
            {(remindersQuery.data || []).map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.dueAt).toLocaleString()}</td>
                <td>{item.lead?.name}</td>
                <td>{item.lead?.status}</td>
                <td>{item.title}</td>
              </tr>
            ))}
            {!remindersQuery.isLoading && (remindersQuery.data || []).length === 0 ? (
              <tr>
                <td colSpan={4}>No upcoming reminders in next 7 days</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
