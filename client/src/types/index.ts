// Core shared types
export type UserRole = 'admin' | 'analyst' | 'viewer';
export type InvestigationStatus = 'open' | 'in_progress' | 'closed' | 'archived';
export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FindingStatus = 'pending' | 'confirmed' | 'dismissed';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: { page?: number; pageSize?: number; total?: number; totalPages?: number };
}
