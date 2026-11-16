import {
  InvestigationStatus,
  InvestigationPriority,
  FindingSeverity,
  FindingStatus,
} from './index';

export interface Investigation {
  id: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  createdBy: string;
  assignedTo?: string;
  assignedUserIds?: string[];
  initialAccountIds?: string[];
  nodeIds: string[];
  edgeIds?: string[];
  graphSnapshot?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Finding {
  id: string;
  investigationId: string;
  findingType?: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  involvedAccounts?: string[];
  nodeIds: string[];
  relevantTransactions?: string[];
  edgeIds: string[];
  rationale?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Note {
  id: string;
  investigationId: string;
  content: string;
  authorId: string;
  authorName?: string;
  targetAccountId?: string;
  targetTransactionId?: string;
  isPinned?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DatasetImport {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  status: string;
  recordCount: number;
  nodeCount: number;
  edgeCount: number;
  errors?: string[];
  metadata?: Record<string, unknown>;
  uploadedBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
