
export const NEXT_STATUS_MAP = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CLOSED', 'LOST'],
  CLOSED: [],
  LOST: [],
};

export const STATUS_COLORS = {
  NEW: { bg: 'rgba(79, 70, 229, 0.15)', text: '#818cf8' },
  CONTACTED: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  QUALIFIED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  CLOSED: { bg: 'rgba(219, 39, 119, 0.15)', text: '#f472b6' },
  LOST: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185' },
};
