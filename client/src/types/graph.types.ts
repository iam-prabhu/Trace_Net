export type NodeStatus = 'normal' | 'suspicious' | 'flagged' | 'under_investigation' | 'cleared';

export interface GraphNode {
  id: string;
  labels?: string[];
  status?: NodeStatus;
  riskScore?: number;
  balance?: number;
  accountType?: 'CHECKING' | 'SAVINGS' | 'BUSINESS' | 'SHELL_COMPANY' | 'CRYPTO_EXCHANGE' | 'MERCHANT' | string;
  communityId?: number;
  degree?: number;
  incomingCount?: number;
  outgoingCount?: number;
  incomingAmount?: number;
  outgoingAmount?: number;
  createdAt?: string;
  isFlagged?: boolean;
  directNeighbors?: string[];
  properties?: Record<string, unknown>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  type?: string;
  source: string;
  target: string;
  startNodeId?: string;
  endNodeId?: string;
  amount: number;
  timestamp?: string;
  status?: 'COMPLETED' | 'FLAGGED' | 'BLOCKED' | 'PENDING' | string;
  transactionType?: 'WIRE' | 'ACH' | 'P2P' | 'CRYPTO' | 'INTERNAL' | string;
  riskScore?: number;
  isHighlighted?: boolean;
  isInCycle?: boolean;
  properties?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TraversalOptions {
  startNodeId: string;
  direction?: 'OUTGOING' | 'INCOMING' | 'BOTH';
  maxDepth?: number;
  minAmount?: number;
  maxAmount?: number;
  relationshipTypes?: string[];
  limit?: number;
}

export interface TraversalResult {
  algorithm: 'BFS' | 'DFS';
  startAccountId: string;
  executionTimeMs: number;
  nodesVisitedCount: number;
  edgesTraversedCount: number;
  reachableAccounts: string[];
  paths: Array<{
    targetAccountId: string;
    depth: number;
    path: string[];
    edges: string[];
    totalAmount?: number;
  }>;
  graph?: GraphData;
}

export interface CycleFinding {
  cycleId: string;
  nodeIds: string[];
  edgeIds: string[];
  length: number;
  totalAmount: number;
  averageAmount: number;
  retentionRatio?: number;
  durationHours?: number;
  riskScore: number;
  patternType: string;
  timestamps: string[];
  explanation?: string;
}

export interface CommunityFinding {
  communityId: number;
  nodeIds: string[];
  size: number;
  totalVolume: number;
  density: number;
  internalEdgeCount: number;
  externalEdgeCount: number;
  modularityContribution?: number;
  dominantRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface GraphStatistics {
  totalAccounts: number;
  totalTransactions: number;
  totalVolume: number;
  activeInvestigations: number;
  flaggedAccounts: number;
  identifiedCycles: number;
  detectedCommunities: number;
  modularityScore: number;
  highRiskVolume: number;
}
