import type { InvestigationStatus, FindingSeverity, FindingStatus } from './index';

export type { InvestigationStatus, FindingSeverity, FindingStatus };

export interface Investigation {
  id: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  investigationId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  nodeIds: string[];
  edgeIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  investigationId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}
