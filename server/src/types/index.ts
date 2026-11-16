// Core shared types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export type UserRole =
  | 'ADMIN'
  | 'INVESTIGATOR'
  | 'VIEWER'
  | 'admin'
  | 'analyst'
  | 'investigator'
  | 'viewer';

export type InvestigationStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'open'
  | 'in_progress'
  | 'under_review'
  | 'closed'
  | 'archived';

export type InvestigationPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type FindingSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type FindingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DISMISSED'
  | 'pending'
  | 'confirmed'
  | 'dismissed';

export type DatasetStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'failed';
