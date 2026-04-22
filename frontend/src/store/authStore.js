import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('crm_token') || null,
  user: JSON.parse(localStorage.getItem('crm_user') || 'null'),
  login: ({ token, user }) => {
    localStorage.setItem('crm_token', token);
    localStorage.setItem('crm_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    set({ token: null, user: null });
  },
}));
