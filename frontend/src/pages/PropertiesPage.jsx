import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';

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

const parseImages = (images) => {
  if (!images) return [];
  return String(images)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const buildMapUrl = (property) => {
  if (property.latitude && property.longitude) {
    return `https://www.google.com/maps?q=${property.latitude},${property.longitude}`;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.city}`)}`;
};

export default function PropertiesPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState(defaultForm);
  const [filters, setFilters] = useState(defaultFilters);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [editingPropertyId, setEditingPropertyId] = useState('');
  const [errorText, setErrorText] = useState('');

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

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const payload = new FormData();
      payload.append('image', file);
      const { data } = await api.post('/properties/upload', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data.url;
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (payload) => {
      await api.post('/properties', payload);
    },
    onSuccess: async () => {
      setForm(defaultForm);
      setImageFiles([]);
      setUploadedImages([]);
      setEditingPropertyId('');
      setErrorText('');
      addToast({ message: 'Property created successfully' });
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to save property');
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      await api.patch(`/properties/${id}`, payload);
    },
    onSuccess: async () => {
      setForm(defaultForm);
      setImageFiles([]);
      setUploadedImages([]);
      setEditingPropertyId('');
      setErrorText('');
      addToast({ message: 'Property updated' });
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (error) => {
      setErrorText(error?.response?.data?.message || 'Unable to update property');
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/properties/${id}`);
    },
    onSuccess: async () => {
      addToast({ message: 'Property deleted' });
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await api.patch(`/properties/${id}`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const isSaving = createPropertyMutation.isPending || updatePropertyMutation.isPending;

  const submitProperty = async (event) => {
    event.preventDefault();

    try {
      let uploadedUrls = [...uploadedImages];
      if (imageFiles.length > 0) {
        const newUrls = [];
        for (const file of imageFiles) {
          const url = await uploadImageMutation.mutateAsync(file);
          newUrls.push(url);
        }
        uploadedUrls = [...uploadedUrls, ...newUrls];
      }

      const payload = {
        ...form,
        price: Number(form.price),
        sizeSqFt: form.sizeSqFt ? Number(form.sizeSqFt) : undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        amenities: form.amenities || undefined,
        images: uploadedUrls,
        agentId: form.agentId || undefined,
      };

      if (editingPropertyId) {
        await updatePropertyMutation.mutateAsync({ id: editingPropertyId, payload });
      } else {
        await createPropertyMutation.mutateAsync(payload);
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || error.message || 'Unable to save property');
    }
  };

  const startEdit = (property) => {
    setEditingPropertyId(property.id);
    setForm({
      title: property.title || '',
      type: property.type || 'RESIDENTIAL',
      status: property.status || 'AVAILABLE',
      address: property.address || '',
      city: property.city || '',
      state: property.state || '',
      zipCode: property.zipCode || '',
      price: property.price ?? '',
      sizeSqFt: property.sizeSqFt ?? '',
      amenities: property.amenities || '',
      latitude: property.latitude ?? '',
      longitude: property.longitude ?? '',
      agentId: property.agentId || '',
    });
    setUploadedImages(parseImages(property.images));
    setImageFiles([]);
  };

  const clearForm = () => {
    setEditingPropertyId('');
    setForm(defaultForm);
    setImageFiles([]);
    setUploadedImages([]);
  };

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 2 && form.address.trim().length > 2 && form.city.trim().length > 1 && String(form.price).length > 0;
  }, [form]);

  return (
    <section>
      <header className="page-header">
        <h2>Properties</h2>
        <p>Create listings, upload images, search inventory, and open map locations.</p>
      </header>

      <div className="panel-grid">
        <form className="form-card" onSubmit={submitProperty}>
          <h3>{editingPropertyId ? 'Edit Property' : 'Add Property'}</h3>
          <div className="form-grid">
            <label>
              Title
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </label>
            <label>
              Type
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </label>
            <label>
              Price
              <input type="number" min="0" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required />
            </label>
            <label className="full-width">
              Address
              <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} required />
            </label>
            <label>
              City
              <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} required />
            </label>
            <label>
              State
              <input value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} />
            </label>
            <label>
              ZIP
              <input value={form.zipCode} onChange={(event) => setForm((current) => ({ ...current, zipCode: event.target.value }))} />
            </label>
            <label>
              Size (sqft)
              <input type="number" min="0" value={form.sizeSqFt} onChange={(event) => setForm((current) => ({ ...current, sizeSqFt: event.target.value }))} />
            </label>
            <label>
              Latitude
              <input type="number" step="any" value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} />
            </label>
            <label>
              Longitude
              <input type="number" step="any" value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} />
            </label>
            <label>
              Agent
              <select value={form.agentId} onChange={(event) => setForm((current) => ({ ...current, agentId: event.target.value }))}>
                <option value="">Auto/default</option>
                {(agentsQuery.data || []).map((agent) => (
                  <option value={agent.id} key={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Amenities
              <input value={form.amenities} onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value }))} />
            </label>
            <label className="full-width">
              Images
              <input type="file" multiple accept="image/*" onChange={(event) => setImageFiles(Array.from(event.target.files || []))} />
            </label>
          </div>

          {uploadedImages.length > 0 ? (
            <div className="image-chip-row">
              {uploadedImages.map((url) => (
                <span className="image-chip" key={url}>
                  Uploaded image
                </span>
              ))}
            </div>
          ) : null}

          <div className="actions-row">
            <button type="submit" disabled={!canSubmit || isSaving || uploadImageMutation.isPending}>
              {isSaving || uploadImageMutation.isPending ? 'Saving...' : editingPropertyId ? 'Update Property' : 'Create Property'}
            </button>
            {editingPropertyId ? (
              <button type="button" onClick={clearForm} className="ghost-btn">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="form-card">
          <h3>Filter & Search</h3>
          <div className="form-grid">
            <label className="full-width">
              Search
              <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Title, address, city, amenities" />
            </label>
            <label>
              City
              <input value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} />
            </label>
            <label>
              Type
              <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
                <option value="">All</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </label>
            <label>
              Status
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </label>
            <label>
              Min Price
              <input type="number" min="0" value={filters.minPrice} onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))} />
            </label>
            <label>
              Max Price
              <input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))} />
            </label>
          </div>

          <button type="button" onClick={() => setFilters(defaultFilters)}>
            Reset Filters
          </button>
        </div>
      </div>

      {errorText ? <div className="error-banner" style={{ marginBottom: 16 }}>{errorText}</div> : null}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Listing</th>
              <th>Type</th>
              <th>Status</th>
              <th>Location</th>
              <th>Price</th>
              <th>Images</th>
              <th>Map</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(propertiesQuery.data || []).map((property) => {
              const images = parseImages(property.images);

              return (
                <tr key={property.id}>
                  <td>
                    <strong>{property.title}</strong>
                    <div className="muted-line">{property.agent?.name || 'No agent'}</div>
                  </td>
                  <td>{property.type}</td>
                  <td>
                    <select
                      value={property.status}
                      onChange={(event) => statusUpdateMutation.mutate({ id: property.id, status: event.target.value })}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="SOLD">SOLD</option>
                      <option value="RENTED">RENTED</option>
                    </select>
                  </td>
                  <td>{property.city}</td>
                  <td>${Number(property.price).toLocaleString()}</td>
                  <td>{images.length}</td>
                  <td>
                    <a href={buildMapUrl(property)} target="_blank" rel="noreferrer" className="table-link">
                      Open map
                    </a>
                  </td>
                  <td>
                    <div className="actions-row compact">
                      <button type="button" onClick={() => startEdit(property)} className="ghost-btn">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePropertyMutation.mutate(property.id)}
                        className="danger-btn"
                        disabled={deletePropertyMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!propertiesQuery.isLoading && (propertiesQuery.data || []).length === 0 ? (
              <tr>
                <td colSpan={8}>No properties found for current filters</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
