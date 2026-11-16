import {
  Investigation,
  Finding,
  Note,
} from '../types/investigation.types';
import { investigationRepository } from '../repositories/investigation.repository';
import { inMemoryStore } from '../repositories/in-memory.store';
import { Account, Transaction, GraphData } from '../types/graph.types';

export interface DetailedInvestigation extends Investigation {
  accounts: Account[];
  transactions: Transaction[];
  findings: Finding[];
  notes: Note[];
  subgraph: GraphData;
}

export async function getInvestigations(filters?: {
  status?: string;
  priority?: string;
  search?: string;
}): Promise<Investigation[]> {
  return investigationRepository.getInvestigations(filters);
}

export async function getInvestigationById(
  id: string
): Promise<DetailedInvestigation | null> {
  const inv = await investigationRepository.getInvestigationById(id);
  if (!inv) return null;

  const nodeIds = inv.nodeIds || inv.initialAccountIds || [];
  const accounts: Account[] = [];
  for (const accId of nodeIds) {
    const acc = inMemoryStore.accounts.get(accId);
    if (acc) accounts.push(acc);
  }

  const edgeIds = inv.edgeIds || [];
  const transactions: Transaction[] = [];
  for (const txnId of edgeIds) {
    const txn = inMemoryStore.transactions.get(txnId);
    if (txn) transactions.push(txn);
  }

  const findings = await investigationRepository.getFindings(id);
  const notes = await investigationRepository.getNotes(id);
  const subgraph = inMemoryStore.getSubgraph(nodeIds, 1);

  return {
    ...inv,
    accounts,
    transactions,
    findings,
    notes,
    subgraph,
  };
}

export async function createInvestigation(
  data: Partial<Investigation>,
  creatorName: string = 'Investigator'
): Promise<Investigation> {
  if (!data.title) {
    throw new Error('Title is required for an investigation');
  }

  return investigationRepository.createInvestigation({
    title: data.title,
    description: data.description,
    priority: data.priority,
    initialAccountIds: data.initialAccountIds || data.nodeIds,
    assignedUserIds: data.assignedUserIds,
    assignedTo: data.assignedTo,
    createdBy: data.createdBy || creatorName,
  });
}

export async function updateInvestigation(
  id: string,
  data: Partial<Investigation>
): Promise<Investigation | null> {
  return investigationRepository.updateInvestigation(id, data);
}

export async function deleteInvestigation(id: string): Promise<boolean> {
  return investigationRepository.deleteInvestigation(id);
}

export async function getFindingsForInvestigation(id: string): Promise<Finding[]> {
  return investigationRepository.getFindings(id);
}

export async function createFindingForInvestigation(
  investigationId: string,
  data: Partial<Finding>,
  creatorName: string = 'Investigator'
): Promise<Finding> {
  if (!data.title) {
    throw new Error('Title is required for a finding');
  }

  return investigationRepository.createFinding({
    investigationId,
    title: data.title,
    description: data.description,
    findingType: data.findingType,
    severity: data.severity,
    status: data.status,
    involvedAccounts: data.involvedAccounts || data.nodeIds,
    nodeIds: data.nodeIds || data.involvedAccounts,
    relevantTransactions: data.relevantTransactions || data.edgeIds,
    edgeIds: data.edgeIds || data.relevantTransactions,
    rationale: data.rationale,
    metadata: data.metadata,
    createdBy: data.createdBy || creatorName,
  });
}

export async function getNotesForInvestigation(id: string): Promise<Note[]> {
  return investigationRepository.getNotes(id);
}

export async function createNoteForInvestigation(
  investigationId: string,
  data: Partial<Note>,
  authorId: string = 'usr-001',
  authorName: string = 'Investigator'
): Promise<Note> {
  if (!data.content) {
    throw new Error('Note content cannot be empty');
  }

  return investigationRepository.createNote({
    investigationId,
    content: data.content,
    authorId: data.authorId || authorId,
    authorName: data.authorName || authorName,
    targetAccountId: data.targetAccountId,
    targetTransactionId: data.targetTransactionId,
    isPinned: data.isPinned,
  });
}
