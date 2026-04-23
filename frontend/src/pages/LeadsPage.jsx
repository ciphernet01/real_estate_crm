import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';

const nextStatusMap = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CLOSED', 'LOST'],
  CLOSED: [],
  LOST: [],
};

const statusLabel = {
  NEW: 'New Lead',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  CLOSED: 'Closed Won',
  LOST: 'Lost',
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeLeadId, setActiveLeadId] = useState('');
  const [showComposer, setShowComposer] = useState(false);
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
      setShowComposer(false);
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

  const leads = leadsQuery.data || [];
  const upcomingReminders = remindersQuery.data || [];

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads
      .filter((lead) => (statusFilter === 'ALL' ? true : lead.status === statusFilter))
      .filter((lead) => {
        if (!term) return true;
        return [lead.name, lead.email, lead.phone, lead.source, lead.preferences]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      });
  }, [leads, search, statusFilter]);

  const remindersByLeadId = useMemo(() => {
    const map = new Map();
    upcomingReminders.forEach((item) => {
      const leadId = item.lead?.id;
      if (!leadId) return;
      map.set(leadId, (map.get(leadId) || 0) + 1);
    });
    return map;
  }, [upcomingReminders]);

  const counts = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((lead) => lead.status === 'NEW').length,
      qualified: leads.filter((lead) => lead.status === 'QUALIFIED').length,
      closed: leads.filter((lead) => lead.status === 'CLOSED').length,
    };
  }, [leads]);

  const canSubmitLead = form.name.trim().length > 1 && form.source.trim().length > 1;

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

  const exportLeads = () => {
    const header = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Budget', 'Assigned'];
    const rows = filteredLeads.map((lead) => [
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.source || '',
      lead.status || '',
      lead.budget || '',
      lead.assignedTo?.name || '',
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const setLeadStatus = (leadId, status) => {
    updateLeadMutation.mutate({
      id: leadId,
      payload: { status },
    });
  };

  return (
    <section>
      <header className="page-header leads-header">
        <div>
          <h2>Contact Leads</h2>
          <p>Pipeline-ready lead workspace with quick actions, reminders, and assignments.</p>
        </div>
        <div className="leads-top-actions">
          <button type="button" className="ghost-btn" onClick={exportLeads}>
            Export
          </button>
          <button type="button" className="primary-btn" onClick={() => setShowComposer((value) => !value)}>
            {showComposer ? 'Close Composer' : 'Add New Lead'}
          </button>
        </div>
      </header>

      <div className="leads-kpi-row">
        <article className="leads-mini-card">
          <span>Total Leads</span>
          <strong>{counts.total}</strong>
        </article>
        <article className="leads-mini-card">
          <span>New</span>
          <strong>{counts.new}</strong>
        </article>
        <article className="leads-mini-card">
          <span>Qualified</span>
          <strong>{counts.qualified}</strong>
        </article>
        <article className="leads-mini-card">
          <span>Closed Won</span>
          <strong>{counts.closed}</strong>
        </article>
      </div>

      <div className="leads-workspace-grid">
        <div>
          <div className="leads-toolbar">
            <div className="leads-search-wrap">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads by name, source, email, phone"
              />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          <div className="leads-card-grid">
            {filteredLeads.map((lead) => {
              const avatar = lead.name
                ?.split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const reminderCount = remindersByLeadId.get(lead.id) || 0;
              const nextStatuses = [lead.status, ...(nextStatusMap[lead.status] || [])];

              return (
                <article className="lead-contact-card" key={lead.id}>
                  <div className="lead-card-top">
                    <div className="lead-id-block">
                      <span className="lead-avatar">{avatar || 'LD'}</span>
                      <div>
                        <strong>{lead.name}</strong>
                        <span>{lead.source || 'Direct'}{lead.assignedTo?.name ? ` · ${lead.assignedTo.name}` : ''}</span>
                      </div>
                    </div>
                    <div className="lead-quick-actions">
                      <a href={lead.phone ? `tel:${lead.phone}` : '#'} onClick={(e) => !lead.phone && e.preventDefault()} aria-label="Call lead">☎</a>
                      <a href={lead.email ? `mailto:${lead.email}` : '#'} onClick={(e) => !lead.email && e.preventDefault()} aria-label="Email lead">↗</a>
                    </div>
                  </div>

                  <div className="lead-value-row">
                    <strong>{lead.budget ? `$${Number(lead.budget).toLocaleString()}` : '$—'}</strong>
                    <span className={`lead-status-pill status-${String(lead.status || '').toLowerCase()}`}>
                      {statusLabel[lead.status] || lead.status}
                    </span>
                  </div>

                  <div className="lead-foot-row">
                    <span>{lead.preferences || 'No preferences added'}</span>
                    {reminderCount > 0 ? (
                      <button type="button" className="lead-reminder-chip" onClick={() => setActiveLeadId(lead.id)}>
                        {reminderCount} reminder{reminderCount > 1 ? 's' : ''}
                      </button>
                    ) : (
                      <button type="button" className="lead-reminder-chip" onClick={() => setActiveLeadId(lead.id)}>
                        Add reminder
                      </button>
                    )}
                  </div>

                  <label className="lead-status-select">
                    Status
                    <select
                      value={lead.status}
                      onChange={(event) => setLeadStatus(lead.id, event.target.value)}
                    >
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              );
            })}

            {!leadsQuery.isLoading && filteredLeads.length === 0 ? (
              <div className="empty-state">No leads match the current filters.</div>
            ) : null}
          </div>
        </div>

        <aside className="leads-rail">
          <div className="leads-rail-card">
            <h3>Reminder</h3>
            <div className="lead-reminder-list">
              {upcomingReminders.slice(0, 4).map((item) => (
                <div key={item.id} className="lead-reminder-item">
                  <strong>{item.title}</strong>
                  <span>{item.lead?.name} · {new Date(item.dueAt).toLocaleDateString()}</span>
                </div>
              ))}
              {upcomingReminders.length === 0 ? <p className="muted-line">No upcoming reminders in the next 7 days.</p> : null}
            </div>
          </div>

          <div className="leads-rail-card feature-property">
            <div>
              <h3>The Somerset</h3>
              <p>Flagship listing</p>
            </div>
            <div className="property-stats">
              <div><strong>175</strong><span>Sold</span></div>
              <div><strong>125</strong><span>Rented</span></div>
              <div><strong>2K+</strong><span>Views</span></div>
            </div>
            <div className="property-media-block">
              <span>Recommended to 14 leads</span>
            </div>
          </div>

          <form className="leads-rail-card" onSubmit={submitReminder}>
            <h3>Create Reminder</h3>
            <div className="form-grid single-col">
              <label>
                Lead
                <select value={activeLeadId} onChange={(e) => setActiveLeadId(e.target.value)}>
                  <option value="">Select lead</option>
                  {leads.map((lead) => (
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
        </aside>
      </div>

      {errorText ? <div className="error-banner" style={{ marginBottom: 16 }}>{errorText}</div> : null}

      {showComposer ? (
        <section className="form-card leads-composer">
          <h3>Add Lead</h3>
          <form className="form-grid" onSubmit={submitLead}>
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
            <div className="actions-row full-width">
              <button type="submit" disabled={!canSubmitLead || createLeadMutation.isPending}>
                {createLeadMutation.isPending ? 'Saving...' : 'Create Lead'}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </section>
  );
}
