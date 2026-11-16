import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, 'MMM d, yyyy');
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: string | Date | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, 'MMM d, yyyy HH:mm');
  } catch {
    return String(date);
  }
}

export function timeAgo(date: string | Date | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}
