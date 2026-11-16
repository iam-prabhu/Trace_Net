export interface Account {
  id: string;
  accountId: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'BUSINESS' | 'INVESTMENT' | 'CRYPTO_WALLET' | 'SHELL_COMPANY' | string;
  riskScore: number;
  status: 'ACTIVE' | 'FLAGGED' | 'UNDER_REVIEW' | 'CLEARED' | string;
  balance: number;
  ownerName: string;
  country: string;
  createdAt: string | Date;
  isFlagged?: boolean;
  communityId?: number;
}

export interface Transaction {
  id: string;
  transactionId: string;
  senderAccountId: string;
  receiverAccountId: string;
  amount: number;
  timestamp: string;
  transactionType: 'WIRE' | 'ACH' | 'INTERNAL' | 'P2P' | 'SWIFT' | string;
  status: 'COMPLETED' | 'FLAGGED' | 'PENDING' | string;
  isSuspicious?: boolean;
  metadata?: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
  // Cytoscape friendly format
  data?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  source?: string;
  target?: string;
  properties: Record<string, unknown>;
  // Cytoscape friendly format
  data?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CytoscapeElement {
  data: {
    id: string;
    source?: string;
    target?: string;
    label?: string;
    [key: string]: unknown;
  };
  classes?: string;
}

export interface TraversalOptions {
  startAccountId?: string;
  startNodeId?: string;
  direction?: 'INCOMING' | 'OUTGOING' | 'BOTH';
  maxDepth?: number;
  limit?: number;
  relationshipTypes?: string[];
  nodeLabels?: string[];
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface TraversalResult {
  algorithm: 'BFS' | 'DFS';
  startAccountId: string;
  reachableAccounts: string[];
  paths: string[][];
  transactions: Transaction[];
  graph: GraphData;
  metrics: {
    executionTimeMs: number;
    nodesVisitedCount: number;
    edgesTraversedCount: number;
    maxDepthReached: number;
  };
}

export interface CycleResult {
  cycleId: string;
  length: number;
  accounts: string[];
  edges: Transaction[];
  totalAmount: number;
  minAmount: number;
  maxAmount: number;
  startTime: string;
  endTime: string;
  timeSpanHours: number;
  riskScore: number;
  patternType: 'ROUND_TRIP' | 'LAYERING_CYCLE' | 'WASH_TRADING';
}

export interface CommunityResult {
  communityId: number;
  size: number;
  accounts: string[];
  internalEdgeCount: number;
  externalEdgeCount: number;
  internalDensity: number;
  totalVolume: number;
  riskProfile: 'HIGH' | 'MEDIUM' | 'LOW';
  topAccounts: string[];
}

export interface LouvainResult {
  modularity: number;
  communitiesCount: number;
  communities: CommunityResult[];
  executionTimeMs: number;
}

export interface GraphStatistics {
  totalAccounts: number;
  totalTransactions: number;
  flaggedAccounts: number;
  activeInvestigations: number;
  detectedCycles: number;
  detectedCommunities: number;
  networkDensity: number;
  averageDegree: number;
  totalVolume: number;
}

export type TraversalDirection = 'INCOMING' | 'OUTGOING' | 'BOTH';

export interface TraversalFilterOptions {
  minAmount?: number;
  maxAmount?: number;
  dateRange?: {
    startDate?: string | Date;
    endDate?: string | Date;
  };
  startDate?: string;
  endDate?: string;
  transactionTypes?: string[];
}

export interface TraversalTransactionEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp?: string;
  type?: string;
  properties?: Record<string, unknown>;
}

export interface BFSOptions {
  startAccountId: string;
  direction?: TraversalDirection;
  maxDepth?: number;
  limit?: number;
  filterOptions?: TraversalFilterOptions;
  graph?: GraphData | unknown;
}

export interface BFSResult {
  startAccountId: string;
  direction: TraversalDirection;
  maxDepth: number;
  reachableAccounts: string[];
  paths: string[][];
  transactions: TraversalTransactionEdge[];
  nodesVisitedCount: number;
  edgesTraversedCount: number;
  executionTimeMs: number;
}

export interface DFSOptions {
  startAccountId: string;
  direction?: TraversalDirection;
  maxDepth?: number;
  limit?: number;
  targetAccountId?: string;
  filterOptions?: TraversalFilterOptions;
  graph?: GraphData | unknown;
}

export interface DFSResult {
  startAccountId: string;
  direction: TraversalDirection;
  maxDepth: number;
  reachableAccounts: string[];
  paths: string[][];
  transactions: TraversalTransactionEdge[];
  nodesVisitedCount: number;
  edgesTraversedCount: number;
  executionTimeMs: number;
  cyclesEncountered?: number;
}

export interface Cycle {
  id: string;
  nodeIds: string[];
  edgeIds: string[];
  transactions: TraversalTransactionEdge[];
  length: number;
  totalAmount: number;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  retentionRatio: number;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  durationHours?: number;
  riskScore: number;
  classification: string;
  explanation: string;
}

export interface StronglyConnectedComponent {
  id: number;
  accountIds: string[];
  size: number;
}

export interface CycleDetectionOptions {
  graph?: GraphData | unknown;
  startAccountId?: string;
  accountIdSubset?: string[];
  minLength?: number;
  maxLength?: number;
  limit?: number;
  minAmount?: number;
  maxAmount?: number;
  dateRange?: {
    startDate?: string | Date;
    endDate?: string | Date;
  };
}

export interface CycleDetectionResult {
  cycles: Cycle[];
  totalCyclesFound: number;
  sccs: StronglyConnectedComponent[];
  executionTimeMs: number;
  summary: {
    totalVolume: number;
    highRiskCyclesCount: number;
    averageCycleLength: number;
  };
}

export interface Community {
  id: number;
  nodeIds: string[];
  size: number;
  totalVolume: number;
  internalEdgeCount: number;
  internalVolume: number;
  internalDensity: number;
  externalEdgeCount: number;
  externalVolume: number;
  riskScore: number;
}

export interface BridgingTransaction {
  transactionId: string;
  senderAccountId: string;
  receiverAccountId: string;
  amount: number;
  timestamp?: string;
  fromCommunityId: number;
  toCommunityId: number;
}

export interface CommunityDetectionOptions {
  graph?: GraphData | unknown;
  resolution?: number;
  weightProperty?: 'amount' | 'count';
  minCommunitySize?: number;
  maxIterations?: number;
}

export interface CommunityDetectionResult {
  modularity: number;
  communities: Community[];
  totalCommunities: number;
  bridgingTransactions: BridgingTransaction[];
  executionTimeMs: number;
}

