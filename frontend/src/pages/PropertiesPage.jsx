import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';
import { Spinner } from '../components/ui/Spinner.jsx';

const defaultForm = {
  title: '',
  type: 'RESIDENTIAL',
  status: 'AVAILABLE',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  price: '',
  sizeSqFt: '',
  amenities: '',
  latitude: '',
  longitude: '',
  agentId: '',
};

const defaultFilters = {
  search: '',
  city: '',
  type: '',
  status: '',
  minPrice: '',
  maxPrice: '',
};

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
];

export default function PropertiesPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState(defaultForm);
  const [filters, setFilters] = useState(defaultFilters);
  const [editingPropertyId, setEditingPropertyId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const propertiesQuery = useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const { data } = await api.get('/properties', { params });
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

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingPropertyId) {
        await api.patch(`/properties/${editingPropertyId}`, payload);
      } else {
        await api.post('/properties', payload);
      }
    },
    onSuccess: async () => {
      setForm(defaultForm);
      setEditingPropertyId('');
      setIsFormOpen(false);
      addToast({ message: `Property ${editingPropertyId ? 'updated' : 'created'} successfully` });
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/properties/${id}`);
    },
    onSuccess: async () => {
      addToast({ message: 'Property removed' });
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const submitProperty = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      sizeSqFt: form.sizeSqFt ? Number(form.sizeSqFt) : undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
    };
    saveMutation.mutate(payload);
  };

  const startEdit = (property) => {
    setEditingPropertyId(property.id);
    setForm({
      title: property.title || '',
      type: property.type || 'RESIDENTIAL',
      status: property.status || 'AVAILABLE',
      address: property.address || '',
      city: property.city || '',
      price: property.price ?? '',
      sizeSqFt: property.sizeSqFt ?? '',
      amenities: property.amenities || '',
      agentId: property.agentId || '',
    });
    setIsFormOpen(true);
  };

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Properties</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage and showcase your real estate inventory</p>
        </div>
        <button 
          onClick={() => { setIsFormOpen(true); setEditingPropertyId(''); setForm(defaultForm); }}
          className="nav-link-pill active"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          Add New Property
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Filters Sidebar */}
        <aside style={{ display: 'grid', gap: '20px' }}>
          <div className="premium-card">
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>Search & Filter</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>SEARCH</span>
                <input 
                  value={filters.search} 
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  placeholder="Key terms..."
                  style={{ fontSize: '0.85rem' }}
                />
              </label>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TYPE</span>
                <select value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
                  <option value="">All Types</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </label>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>STATUS</span>
                <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
                  <option value="">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                </select>
              </label>
              <button 
                onClick={() => setFilters(defaultFilters)}
                style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer', marginTop: '8px' }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Properties Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {propertiesQuery.isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}><Spinner size={32} /></div>
          ) : (propertiesQuery.data || []).map((prop, idx) => (
            <article key={prop.id} className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: '200px' }}>
                <img 
                  src={PROPERTY_IMAGES[idx % PROPERTY_IMAGES.length]} 
                  alt={prop.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--gradient-indigo)', color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800 }}>
                  {prop.type}
                </div>
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.95)', color: '#0f172a', padding: '4px 12px', borderRadius: '8px', fontSize: '1rem', fontWeight: 800 }}>
                  ${Number(prop.price).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{prop.title}</h4>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: prop.status === 'AVAILABLE' ? '#10b981' : '#f59e0b', background: prop.status === 'AVAILABLE' ? '#ecfdf5' : '#fffbeb', padding: '2px 8px', borderRadius: '999px' }}>
                    {prop.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {prop.city}, {prop.address}
                </p>
                <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9', paddingTop: '16px', gap: '16px' }}>
                  <button onClick={() => startEdit(prop)} style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deletePropertyMutation.mutate(prop.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fef2f2', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Property Form Modal (Simple version for demo) */}
      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="premium-card" style={{ width: 'min(600px, 95%)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{editingPropertyId ? 'Edit Property' : 'Add New Property'}</h3>
              <button 
                onClick={() => setIsFormOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={submitProperty} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="full-width">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TITLE</span>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </label>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TYPE</span>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </label>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PRICE</span>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                </label>
              </div>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ADDRESS</span>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>CITY</span>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
                </label>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>AGENT</span>
                  <select value={form.agentId} onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))}>
                    <option value="">Select Agent</option>
                    {(agentsQuery.data || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" disabled={saveMutation.isPending} className="nav-link-pill active" style={{ flex: 1, border: 'none', cursor: 'pointer' }}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Property'}
                </button>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '999px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
