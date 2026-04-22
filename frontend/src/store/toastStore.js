import { create } from 'zustand';

let _toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: ({ message, type = 'success', duration = 4000 }) => {
    const id = ++_toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
