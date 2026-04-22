import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';

const emptyClientForm = {
  name: '',
  email: '',
  phone: '',
  type: 'BUYER',
  preferences: '',
};

const emptyInteractionForm = {
  type: 'NOTE',
  content: '',
};

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [interactionForm, setInteractionForm] = useState(emptyInteractionForm);
  const [editingClientId, setEditingClientId] = useState('');
  const [activeClientId, setActiveClientId] = useState('');
  const [leadToLink, setLeadToLink] = useState('');
  const [errorText, setErrorText] = useState('');

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data.data;
    },
  });

  const leadsQuery = useQuery({
    queryKey: ['leads-for-clients'],
    queryFn: async () => {
      const { data } = await api.get('/leads');
      return data.data;
    },
  });

  const clientDetailsQuery = useQuery({
    queryKey: ['client-details', activeClientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${activeClientId}`);
      return data.data;
    },
    enabled: Boolean(activeClientId),
  });

  const clientDealsQuery = useQuery({
    queryKey: ['client-deals', activeClientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${activeClientId}/deals`);
      return data.data;
    },
    enabled: Boolean(activeClientId),
  });

  const saveClientMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...clientForm,
        email: clientForm.email || undefined,
        phone: clientForm.phone || undefined,
        preferences: clientForm.preferences || undefined,
      };

      if (editingClientId) {
        await api.patch(`/clients/${editingClientId}`, payload);
      } else {
        await api.post('/clients', payload);
      }
    },
    onSuccess: async () => {
      const msg = editingClientId ? 'Client updated' : 'Client created';
      setClientForm(emptyClientForm);
      setEditingClientId('');
      setErrorText('');
      addToast({ message: msg });
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to save client');
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/clients/${activeClientId}/interactions`, interactionForm);
    },
    onSuccess: async () => {
      setInteractionForm(emptyInteractionForm);
      setErrorText('');
      addToast({ message: 'Interaction logged' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client-details', activeClientId] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to add interaction');
    },
  });

  const linkLeadMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/clients/${activeClientId}/link-lead`, { leadId: leadToLink });
    },
    onSuccess: async () => {
      setLeadToLink('');
      setErrorText('');
      addToast({ message: 'Lead linked to client' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['leads-for-clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client-details', activeClientId] }),
        queryClient.invalidateQueries({ queryKey: ['client-deals', activeClientId] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to link lead');
    },
  });

  const unlinkLeadMutation = useMutation({
    mutationFn: async (leadId) => {
      await api.delete(`/clients/${activeClientId}/link-lead/${leadId}`);
    },
    onSuccess: async () => {
      addToast({ message: 'Lead unlinked' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['leads-for-clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client-details', activeClientId] }),
        queryClient.invalidateQueries({ queryKey: ['client-deals', activeClientId] }),
      ]);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: async () => {
      if (activeClientId) setActiveClientId('');
      addToast({ message: 'Client deleted' });
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const startEditClient = (client) => {
    setEditingClientId(client.id);
    setClientForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      type: client.type || 'BUYER',
      preferences: client.preferences || '',
    });
  };

  const details = clientDetailsQuery.data;
  const unlinkedLeads = (leadsQuery.data || []).filter((lead) => !lead.clientId);

  return (
    <section>
      <header className="page-header">
        <h2>Clients</h2>
        <p>Buyer/seller profiles with interaction logs, lead links, and deal visibility.</p>
      </header>

      <div className="panel-grid">
        <form
          className="form-card"
          onSubmit={(event) => {
            event.preventDefault();
            saveClientMutation.mutate();
          }}
        >
          <h3>{editingClientId ? 'Edit Client' : 'Add Client'}</h3>
          <div className="form-grid">
            <label>
              Name
              <input value={clientForm.name} onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label>
              Type
              <select value={clientForm.type} onChange={(event) => setClientForm((current) => ({ ...current, type: event.target.value }))}>
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
                <option value="BOTH">Both</option>
              </select>
            </label>
            <label>
              Email
              <input type="email" value={clientForm.email} onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Phone
              <input value={clientForm.phone} onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="full-width">
              Preferences
              <input value={clientForm.preferences} onChange={(event) => setClientForm((current) => ({ ...current, preferences: event.target.value }))} />
            </label>
          </div>
          <div className="actions-row">
            <button type="submit" disabled={saveClientMutation.isPending}>
              {saveClientMutation.isPending ? 'Saving...' : editingClientId ? 'Update Client' : 'Create Client'}
            </button>
            {editingClientId ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setEditingClientId('');
                  setClientForm(emptyClientForm);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="form-card">
          <h3>Client Activity</h3>
          <div className="form-grid single-col">
            <label>
              Active client
              <select value={activeClientId} onChange={(event) => setActiveClientId(event.target.value)}>
                <option value="">Select client</option>
                {(clientsQuery.data || []).map((client) => (
                  <option value={client.id} key={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Interaction type
              <select value={interactionForm.type} onChange={(event) => setInteractionForm((current) => ({ ...current, type: event.target.value }))}>
                <option value="NOTE">Note</option>
                <option value="CALL">Call</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
              </select>
            </label>
            <label>
              Interaction details
              <input value={interactionForm.content} onChange={(event) => setInteractionForm((current) => ({ ...current, content: event.target.value }))} />
            </label>
          </div>
          <button
            type="button"
            disabled={!activeClientId || !interactionForm.content.trim() || addInteractionMutation.isPending}
            onClick={() => addInteractionMutation.mutate()}
          >
            {addInteractionMutation.isPending ? 'Saving...' : 'Add Interaction'}
          </button>
        </div>
      </div>

      <div className="panel-grid">
        <div className="form-card">
          <h3>Link Lead to Active Client</h3>
          <div className="form-grid single-col">
            <label>
              Unlinked lead
              <select value={leadToLink} onChange={(event) => setLeadToLink(event.target.value)}>
                <option value="">Select lead</option>
                {unlinkedLeads.map((lead) => (
                  <option value={lead.id} key={lead.id}>
                    {lead.name} ({lead.status})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" disabled={!activeClientId || !leadToLink || linkLeadMutation.isPending} onClick={() => linkLeadMutation.mutate()}>
            {linkLeadMutation.isPending ? 'Linking...' : 'Link Lead'}
          </button>
        </div>

        <div className="form-card">
          <h3>Active Client Summary</h3>
          {!activeClientId ? (
            <div className="muted-line">Select a client to view linked leads, interactions, and deals.</div>
          ) : (
            <div className="form-grid single-col">
              <div>
                <strong>Linked leads:</strong> {details?.leads?.length || 0}
              </div>
              <div>
                <strong>Interactions:</strong> {details?.interactions?.length || 0}
              </div>
              <div>
                <strong>Deals:</strong> {(clientDealsQuery.data || []).length}
              </div>
            </div>
          )}
        </div>
      </div>

      {errorText ? <div className="error-banner" style={{ marginBottom: 16 }}>{errorText}</div> : null}

      <div className="table-card" style={{ marginBottom: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Type</th>
              <th>Leads</th>
              <th>Deals</th>
              <th>Interactions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(clientsQuery.data || []).map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.name}</strong>
                  <div className="muted-line">{client.email || client.phone || 'No contact info'}</div>
                </td>
                <td>{client.type || '-'}</td>
                <td>{client.leads?.length || 0}</td>
                <td>{client.dealsCount || 0}</td>
                <td>{client.interactionsCount || 0}</td>
                <td>
                  <div className="actions-row compact">
                    <button type="button" className="ghost-btn" onClick={() => setActiveClientId(client.id)}>
                      Open
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => startEditClient(client)}>
                      Edit
                    </button>
                    <button type="button" className="danger-btn" onClick={() => deleteClientMutation.mutate(client.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!clientsQuery.isLoading && (clientsQuery.data || []).length === 0 ? (
              <tr>
                <td colSpan={6}>No clients found</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {activeClientId ? (
        <>
          <div className="table-card" style={{ marginBottom: 18 }}>
            <table>
              <thead>
                <tr>
                  <th>Linked Lead</th>
                  <th>Status</th>
                  <th>Deal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(details?.leads || []).map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.name}</td>
                    <td>{lead.status}</td>
                    <td>{lead.deal?.title || '-'}</td>
                    <td>
                      <button type="button" className="ghost-btn" onClick={() => unlinkLeadMutation.mutate(lead.id)}>
                        Unlink
                      </button>
                    </td>
                  </tr>
                ))}
                {(details?.leads || []).length === 0 ? (
                  <tr>
                    <td colSpan={4}>No linked leads</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="table-card" style={{ marginBottom: 18 }}>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {(details?.interactions || []).map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.occurredAt).toLocaleString()}</td>
                    <td>{item.type}</td>
                    <td>{item.content}</td>
                  </tr>
                ))}
                {(details?.interactions || []).length === 0 ? (
                  <tr>
                    <td colSpan={3}>No interactions yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Stage</th>
                  <th>Lead</th>
                  <th>Property</th>
                  <th>Agent</th>
                </tr>
              </thead>
              <tbody>
                {(clientDealsQuery.data || []).map((deal) => (
                  <tr key={deal.id}>
                    <td>{deal.title}</td>
                    <td>{deal.stage}</td>
                    <td>{deal.lead?.name || '-'}</td>
                    <td>{deal.property?.title || '-'}</td>
                    <td>{deal.agent?.name || '-'}</td>
                  </tr>
                ))}
                {!clientDealsQuery.isLoading && (clientDealsQuery.data || []).length === 0 ? (
                  <tr>
                    <td colSpan={5}>No deals linked to this client yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
