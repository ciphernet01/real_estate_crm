import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

function resolveApiBaseUrl() {
  const explicitApiUrl = import.meta.env.VITE_API_URL;
  if (explicitApiUrl) {
    return explicitApiUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:4000/api';
  }

  const { protocol, hostname } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalHost) {
    return 'http://localhost:4000/api';
  }

  if (hostname.endsWith('.onrender.com') && hostname.includes('-frontend')) {
    return `${protocol}//${hostname.replace('-frontend', '-backend')}/api`;
  }

  return `${protocol}//${hostname}/api`;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error?.config?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout();
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);
