import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { Button, Banner } from '../components/ui/index.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: 'admin@crm.local', password: 'Admin@123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const { data } = await api.post('/auth/login', payload);
      login(data);
      navigate('/', { replace: true });
    } catch (err) {
      if (!err?.response) {
        setError(`Unable to reach auth server. Check API URL/CORS (current API: ${api.defaults.baseURL})`);
      } else {
        setError(err?.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#f8fafc' }}>💼 Real Estate CRM</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Enterprise Sales & Operations Platform</p>
        </div>

        <div style={{ margin: '24px 0 16px 0 ', padding: '12px', backgroundColor: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: '8px', fontSize: '0.85rem ', color: '#818cf8', textAlign: 'center' }}>
          💡 Demo: admin@crm.local / Admin@123
        </div>

        <div className="form-group">
          <label>
            Email Address
            <input
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              type="email"
              placeholder="your@email.com"
              required
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Password
            <input
              value={form.password}
              onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
              type="password"
              placeholder="••••••••"
              required
            />
          </label>
        </div>

        {error && <Banner type="error" title="Login Failed" message={error} />}

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          style={{ marginTop: '12px' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>Enterprise CRM v1.0.0</p>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>© 2025 All Rights Reserved</p>
        </div>
      </form>
    </div>
  );
}
