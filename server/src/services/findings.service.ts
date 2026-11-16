import { Finding } from '../types/investigation.types';
import { investigationRepository } from '../repositories/investigation.repository';

export async function getFindings(investigationId?: string): Promise<Finding[]> {
  return investigationRepository.getFindings(investigationId);
}

export async function getFindingById(id: string): Promise<Finding | null> {
  return investigationRepository.getFindingById(id);
}

export async function createFinding(
  data: Partial<Finding>,
  creatorName: string = 'Investigator'
): Promise<Finding> {
  if (!data.investigationId) {
    throw new Error('investigationId is required');
  }
  if (!data.title) {
    throw new Error('title is required');
  }

  return investigationRepository.createFinding({
    investigationId: data.investigationId,
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

export async function updateFinding(
  id: string,
  data: Partial<Finding>
): Promise<Finding | null> {
  return investigationRepository.updateFinding(id, data);
}

export async function deleteFinding(id: string): Promise<boolean> {
  return investigationRepository.deleteFinding(id);
}
