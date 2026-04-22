import { useToastStore } from '../store/toastStore.js';

export function useToast() {
  const addToast = useToastStore((state) => state.addToast);

  return {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info: (message) => addToast(message, 'info'),
  };
}
