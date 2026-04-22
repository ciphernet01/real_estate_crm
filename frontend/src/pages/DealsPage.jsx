import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';

const stageColumns = ['NEGOTIATION', 'AGREEMENT', 'CLOSED'];

const defaultForm = {
  title: '',
  leadId: '',
  propertyId: '',
  agentId: '',
  stage: 'NEGOTIATION',
  commissionRate: '2',
  commission: '',
  notes: '',
};

export default function DealsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState(defaultForm);
  const [activeDealId, setActiveDealId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [errorText, setErrorText] = useState('');

  const dealsQuery = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data } = await api.get('/deals');
      return data.data;
    },
  });

  const leadsQuery = useQuery({
    queryKey: ['deal-leads'],
    queryFn: async () => {
      const { data } = await api.get('/leads');
      return data.data;
    },
  });

  const propertiesQuery = useQuery({
    queryKey: ['deal-properties'],
    queryFn: async () => {
      const { data } = await api.get('/properties');
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

  const reportQuery = useQuery({
    queryKey: ['deal-report-summary'],
    queryFn: async () => {
      const { data } = await api.get('/deals/reports/summary');
      return data.data;
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (payload) => {
      await api.post('/deals', payload);
    },
    onSuccess: async () => {
      setForm(defaultForm);
      setErrorText('');
      addToast({ message: 'Deal created' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['deal-report-summary'] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to create deal');
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      await api.patch(`/deals/${id}`, payload);
    },
    onSuccess: async () => {
      setErrorText('');
      addToast({ message: 'Deal updated' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['deal-report-summary'] }),
      ]);
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to update deal');
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('document', documentFile);
      if (documentName) payload.append('name', documentName);
      await api.post(`/deals/${activeDealId}/documents`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: async () => {
      setDocumentName('');
      setDocumentFile(null);
      setErrorText('');
      addToast({ message: 'Document uploaded' });
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to upload document');
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/deals/${id}`);
    },
    onSuccess: async () => {
      addToast({ message: 'Deal deleted' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['deal-report-summary'] }),
      ]);
    },
  });

  const submitDeal = (event) => {
    event.preventDefault();

    createDealMutation.mutate({
      title: form.title,
      leadId: form.leadId || undefined,
      propertyId: form.propertyId || undefined,
      agentId: form.agentId || undefined,
      stage: form.stage,
      commission: form.commission ? Number(form.commission) : undefined,
      commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
      notes: form.notes || undefined,
    });
  };

  const submitDocument = (event) => {
    event.preventDefault();
    if (!activeDealId || !documentFile) {
      setErrorText('Choose deal and file to upload document');
      return;
    }
    uploadDocumentMutation.mutate();
  };

  const dealsByStage = useMemo(() => {
    const map = {
      NEGOTIATION: [],
      AGREEMENT: [],
      CLOSED: [],
    };

    (dealsQuery.data || []).forEach((deal) => {
      map[deal.stage]?.push(deal);
    });

    return map;
  }, [dealsQuery.data]);

  return (
    <section>
      <header className="page-header">
        <h2>Deals</h2>
        <p>Kanban pipeline, commission tracking, document uploads, and stage reporting.</p>
      </header>

      <div className="stats-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <span className="stat-label">Total Deals</span>
          <strong className="stat-value">{reportQuery.data?.totalDeals || 0}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Closed Deals</span>
          <strong className="stat-value">{reportQuery.data?.closedDeals || 0}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Conversion Rate</span>
          <strong className="stat-value">{reportQuery.data?.conversionRate || 0}%</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Commission</span>
          <strong className="stat-value">${(reportQuery.data?.totalCommission || 0).toLocaleString()}</strong>
        </div>
      </div>

      <div className="panel-grid">
        <form className="form-card" onSubmit={submitDeal}>
          <h3>Create Deal</h3>
          <div className="form-grid">
            <label>
              Title
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </label>
            <label>
              Stage
              <select value={form.stage} onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}>
                <option value="NEGOTIATION">NEGOTIATION</option>
                <option value="AGREEMENT">AGREEMENT</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>
            <label>
              Lead
              <select value={form.leadId} onChange={(event) => setForm((current) => ({ ...current, leadId: event.target.value }))}>
                <option value="">None</option>
                {(leadsQuery.data || []).map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Property
              <select value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))}>
                <option value="">None</option>
                {(propertiesQuery.data || []).map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Agent
              <select value={form.agentId} onChange={(event) => setForm((current) => ({ ...current, agentId: event.target.value }))}>
                <option value="">Auto/default</option>
                {(agentsQuery.data || []).map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Commission Rate (%)
              <input type="number" min="0" max="100" step="0.01" value={form.commissionRate} onChange={(event) => setForm((current) => ({ ...current, commissionRate: event.target.value }))} />
            </label>
            <label>
              Override Commission ($)
              <input type="number" min="0" step="0.01" value={form.commission} onChange={(event) => setForm((current) => ({ ...current, commission: event.target.value }))} />
            </label>
            <label className="full-width">
              Notes
              <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          <button type="submit" disabled={createDealMutation.isPending || !form.title.trim()}>
            {createDealMutation.isPending ? 'Saving...' : 'Create Deal'}
          </button>
        </form>

        <form className="form-card" onSubmit={submitDocument}>
          <h3>Upload Deal Document</h3>
          <div className="form-grid single-col">
            <label>
              Deal
              <select value={activeDealId} onChange={(event) => setActiveDealId(event.target.value)}>
                <option value="">Select deal</option>
                {(dealsQuery.data || []).map((deal) => (
                  <option value={deal.id} key={deal.id}>
                    {deal.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Document name
              <input value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Agreement / Contract / KYC" />
            </label>
            <label>
              File
              <input type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
            </label>
          </div>
          <button type="submit" disabled={!activeDealId || !documentFile || uploadDocumentMutation.isPending}>
            {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {errorText ? <div className="error-banner" style={{ marginBottom: 16 }}>{errorText}</div> : null}

      <div className="kanban-grid">
        {stageColumns.map((stage) => (
          <div className="kanban-column" key={stage}>
            <div className="kanban-header">{stage}</div>
            <div className="kanban-cards">
              {(dealsByStage[stage] || []).map((deal) => (
                <div className="kanban-card" key={deal.id}>
                  <div className="kanban-title-row">
                    <strong>{deal.title}</strong>
                    <button type="button" className="danger-btn" onClick={() => deleteDealMutation.mutate(deal.id)}>
                      Delete
                    </button>
                  </div>
                  <div className="muted-line">Lead: {deal.lead?.name || '-'}</div>
                  <div className="muted-line">Property: {deal.property?.title || '-'}</div>
                  <div className="muted-line">Commission: ${Number(deal.commission || 0).toLocaleString()}</div>
                  <label>
                    Stage
                    <select
                      value={deal.stage}
                      onChange={(event) =>
                        updateDealMutation.mutate({
                          id: deal.id,
                          payload: { stage: event.target.value },
                        })
                      }
                    >
                      <option value="NEGOTIATION">NEGOTIATION</option>
                      <option value="AGREEMENT">AGREEMENT</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </label>
                  <div className="doc-list">
                    <strong>Documents</strong>
                    {deal.documents?.length ? (
                      deal.documents.map((doc) => (
                        <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="table-link">
                          {doc.name}
                        </a>
                      ))
                    ) : (
                      <span className="muted-line">No documents</span>
                    )}
                  </div>
                </div>
              ))}
              {(dealsByStage[stage] || []).length === 0 ? <div className="empty-state">No deals in this stage</div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
