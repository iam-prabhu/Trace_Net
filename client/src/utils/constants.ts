export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:4000';

export const SEVERITY_COLORS = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-orange-600 bg-orange-100',
  critical: 'text-red-600 bg-red-100',
} as const;

export const STATUS_COLORS = {
  open: 'text-blue-600 bg-blue-100',
  in_progress: 'text-yellow-600 bg-yellow-100',
  closed: 'text-gray-600 bg-gray-100',
  archived: 'text-purple-600 bg-purple-100',
} as const;

export const PAGE_SIZE = 20;
