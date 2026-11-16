import type { GraphData, GraphStatistics, CycleFinding, CommunityFinding } from '../types/graph.types';
import type { Finding, Investigation, Note } from '../types/investigation.types';

export const MOCK_GRAPH: GraphData = {
  nodes: [
    // Ring 1: Layering cycle (high risk)
    { id: 'ACC-101', accountType: 'SHELL_COMPANY', balance: 420000, riskScore: 92, status: 'flagged', communityId: 1, degree: 4, createdAt: '2025-01-12' },
    { id: 'ACC-102', accountType: 'BUSINESS', balance: 395000, riskScore: 88, status: 'flagged', communityId: 1, degree: 3, createdAt: '2025-01-15' },
    { id: 'ACC-103', accountType: 'CRYPTO_EXCHANGE', balance: 810000, riskScore: 85, status: 'under_investigation', communityId: 1, degree: 4, createdAt: '2025-02-01' },
    { id: 'ACC-104', accountType: 'BUSINESS', balance: 140000, riskScore: 78, status: 'under_investigation', communityId: 1, degree: 3, createdAt: '2025-02-10' },

    // Ring 2: Rapid fund pass-through cycle
    { id: 'ACC-201', accountType: 'CHECKING', balance: 65000, riskScore: 76, status: 'suspicious', communityId: 2, degree: 3, createdAt: '2025-03-01' },
    { id: 'ACC-202', accountType: 'SAVINGS', balance: 58000, riskScore: 74, status: 'suspicious', communityId: 2, degree: 3, createdAt: '2025-03-03' },
    { id: 'ACC-203', accountType: 'CHECKING', balance: 61000, riskScore: 72, status: 'suspicious', communityId: 2, degree: 3, createdAt: '2025-03-05' },

    // Community 3: Normal retail transactions
    { id: 'ACC-301', accountType: 'MERCHANT', balance: 1250000, riskScore: 14, status: 'cleared', communityId: 3, degree: 5, createdAt: '2024-06-15' },
    { id: 'ACC-302', accountType: 'CHECKING', balance: 8400, riskScore: 12, status: 'normal', communityId: 3, degree: 2, createdAt: '2024-09-10' },
    { id: 'ACC-303', accountType: 'CHECKING', balance: 12500, riskScore: 18, status: 'normal', communityId: 3, degree: 2, createdAt: '2024-10-02' },
    { id: 'ACC-304', accountType: 'SAVINGS', balance: 45000, riskScore: 9, status: 'cleared', communityId: 3, degree: 3, createdAt: '2024-05-18' },
    { id: 'ACC-305', accountType: 'CHECKING', balance: 3200, riskScore: 22, status: 'normal', communityId: 3, degree: 2, createdAt: '2024-11-20' },

    // Bridge Accounts (Money Mules connecting rings to merchants)
    { id: 'ACC-401', accountType: 'CHECKING', balance: 195000, riskScore: 84, status: 'flagged', communityId: 1, degree: 4, createdAt: '2025-02-14' },
    { id: 'ACC-402', accountType: 'BUSINESS', balance: 310000, riskScore: 68, status: 'under_investigation', communityId: 2, degree: 3, createdAt: '2025-01-28' },
    { id: 'ACC-403', accountType: 'MERCHANT', balance: 890000, riskScore: 28, status: 'normal', communityId: 3, degree: 3, createdAt: '2024-07-22' },
  ],
  edges: [
    // Cycle 1: ACC-101 -> ACC-102 -> ACC-103 -> ACC-104 -> ACC-101
    { id: 'TXN-101', source: 'ACC-101', target: 'ACC-102', amount: 150000, transactionType: 'WIRE', status: 'FLAGGED', timestamp: '2025-03-10T10:14:00Z', riskScore: 90 },
    { id: 'TXN-102', source: 'ACC-102', target: 'ACC-103', amount: 147500, transactionType: 'CRYPTO', status: 'FLAGGED', timestamp: '2025-03-10T11:22:00Z', riskScore: 92 },
    { id: 'TXN-103', source: 'ACC-103', target: 'ACC-104', amount: 142000, transactionType: 'WIRE', status: 'FLAGGED', timestamp: '2025-03-10T13:45:00Z', riskScore: 89 },
    { id: 'TXN-104', source: 'ACC-104', target: 'ACC-101', amount: 139000, transactionType: 'WIRE', status: 'FLAGGED', timestamp: '2025-03-10T15:30:00Z', riskScore: 94 },

    // Cycle 2: ACC-201 -> ACC-202 -> ACC-203 -> ACC-201
    { id: 'TXN-201', source: 'ACC-201', target: 'ACC-202', amount: 48000, transactionType: 'P2P', status: 'FLAGGED', timestamp: '2025-03-11T09:05:00Z', riskScore: 78 },
    { id: 'TXN-202', source: 'ACC-202', target: 'ACC-203', amount: 47200, transactionType: 'P2P', status: 'FLAGGED', timestamp: '2025-03-11T09:40:00Z', riskScore: 80 },
    { id: 'TXN-203', source: 'ACC-203', target: 'ACC-201', amount: 46500, transactionType: 'P2P', status: 'FLAGGED', timestamp: '2025-03-11T10:15:00Z', riskScore: 82 },

    // Cross-link connections & Bridge transactions
    { id: 'TXN-301', source: 'ACC-101', target: 'ACC-401', amount: 85000, transactionType: 'WIRE', status: 'FLAGGED', timestamp: '2025-03-09T08:00:00Z', riskScore: 86 },
    { id: 'TXN-302', source: 'ACC-401', target: 'ACC-402', amount: 79000, transactionType: 'ACH', status: 'FLAGGED', timestamp: '2025-03-09T14:10:00Z', riskScore: 75 },
    { id: 'TXN-303', source: 'ACC-402', target: 'ACC-201', amount: 50000, transactionType: 'WIRE', status: 'COMPLETED', timestamp: '2025-03-10T08:15:00Z', riskScore: 70 },
    { id: 'TXN-304', source: 'ACC-401', target: 'ACC-403', amount: 35000, transactionType: 'ACH', status: 'COMPLETED', timestamp: '2025-03-10T16:00:00Z', riskScore: 40 },

    // Retail community 3
    { id: 'TXN-401', source: 'ACC-302', target: 'ACC-301', amount: 450, transactionType: 'P2P', status: 'COMPLETED', timestamp: '2025-03-11T12:00:00Z', riskScore: 10 },
    { id: 'TXN-402', source: 'ACC-303', target: 'ACC-301', amount: 1200, transactionType: 'P2P', status: 'COMPLETED', timestamp: '2025-03-11T13:20:00Z', riskScore: 12 },
    { id: 'TXN-403', source: 'ACC-305', target: 'ACC-301', amount: 890, transactionType: 'P2P', status: 'COMPLETED', timestamp: '2025-03-11T15:10:00Z', riskScore: 15 },
    { id: 'TXN-404', source: 'ACC-304', target: 'ACC-301', amount: 3400, transactionType: 'ACH', status: 'COMPLETED', timestamp: '2025-03-11T16:45:00Z', riskScore: 8 },
    { id: 'TXN-405', source: 'ACC-403', target: 'ACC-304', amount: 12000, transactionType: 'WIRE', status: 'COMPLETED', timestamp: '2025-03-11T18:00:00Z', riskScore: 25 },
  ],
};

export const MOCK_STATISTICS: GraphStatistics = {
  totalAccounts: 1842,
  totalTransactions: 9420,
  totalVolume: 48920000,
  activeInvestigations: 7,
  flaggedAccounts: 38,
  identifiedCycles: 14,
  detectedCommunities: 8,
  modularityScore: 0.642,
  highRiskVolume: 12450000,
};

export const MOCK_CYCLES: CycleFinding[] = [
  {
    cycleId: 'CYC-001',
    nodeIds: ['ACC-101', 'ACC-102', 'ACC-103', 'ACC-104', 'ACC-101'],
    edgeIds: ['TXN-101', 'TXN-102', 'TXN-103', 'TXN-104'],
    length: 4,
    totalAmount: 578500,
    averageAmount: 144625,
    retentionRatio: 0.927,
    durationHours: 5.25,
    riskScore: 94,
    patternType: 'MULTI_HOP_LAYERING_RING',
    timestamps: ['2025-03-10T10:14:00Z', '2025-03-10T11:22:00Z', '2025-03-10T13:45:00Z', '2025-03-10T15:30:00Z'],
    explanation: 'Rapid fund recirculation through shell companies and crypto gateway retaining 92.7% of volume within 5.3 hours.',
  },
  {
    cycleId: 'CYC-002',
    nodeIds: ['ACC-201', 'ACC-202', 'ACC-203', 'ACC-201'],
    edgeIds: ['TXN-201', 'TXN-202', 'TXN-203'],
    length: 3,
    totalAmount: 141700,
    averageAmount: 47233,
    retentionRatio: 0.968,
    durationHours: 1.15,
    riskScore: 82,
    patternType: 'HIGH_VELOCITY_CIRCULAR_ROUTING',
    timestamps: ['2025-03-11T09:05:00Z', '2025-03-11T09:40:00Z', '2025-03-11T10:15:00Z'],
    explanation: 'High velocity P2P triangle transferring ~$47k per hop completed in 70 minutes.',
  },
];

export const MOCK_COMMUNITIES: CommunityFinding[] = [
  {
    communityId: 1,
    nodeIds: ['ACC-101', 'ACC-102', 'ACC-103', 'ACC-104', 'ACC-401'],
    size: 5,
    totalVolume: 742500,
    density: 0.75,
    internalEdgeCount: 5,
    externalEdgeCount: 2,
    modularityContribution: 0.38,
    dominantRiskLevel: 'CRITICAL',
  },
  {
    communityId: 2,
    nodeIds: ['ACC-201', 'ACC-202', 'ACC-203', 'ACC-402'],
    size: 4,
    totalVolume: 220700,
    density: 0.67,
    internalEdgeCount: 4,
    externalEdgeCount: 2,
    modularityContribution: 0.22,
    dominantRiskLevel: 'HIGH',
  },
  {
    communityId: 3,
    nodeIds: ['ACC-301', 'ACC-302', 'ACC-303', 'ACC-304', 'ACC-305', 'ACC-403'],
    size: 6,
    totalVolume: 56440,
    density: 0.45,
    internalEdgeCount: 5,
    externalEdgeCount: 1,
    modularityContribution: 0.18,
    dominantRiskLevel: 'LOW',
  },
];

export const MOCK_INVESTIGATIONS: Investigation[] = [
  {
    id: 'INV-2025-001',
    title: 'Offshore Layering Ring - Shell Corp Cluster',
    description: 'Suspicious 4-hop circular transfer totaling $578k involving crypto on-ramp and shell entity ACC-101.',
    status: 'in_progress',
    createdBy: 'Sarah Lin (Lead)',
    assignedTo: 'Marcus Vance',
    createdAt: '2025-03-10T16:00:00Z',
    updatedAt: '2025-03-11T10:30:00Z',
  },
  {
    id: 'INV-2025-002',
    title: 'High Velocity Retail P2P Pass-Through',
    description: 'Repeated structured sub-$50k transfers across 3 consumer accounts completed within 1 hour.',
    status: 'open',
    createdBy: 'Dave Miller',
    assignedTo: 'Sarah Lin',
    createdAt: '2025-03-11T11:00:00Z',
    updatedAt: '2025-03-11T11:45:00Z',
  },
  {
    id: 'INV-2025-003',
    title: 'Bridge Entity Flow Analysis - ACC-401',
    description: 'Inter-community mule hub funneling funds from illicit crypto exchanges into merchant settlement.',
    status: 'open',
    createdBy: 'Marcus Vance',
    assignedTo: 'Marcus Vance',
    createdAt: '2025-03-08T09:20:00Z',
    updatedAt: '2025-03-09T17:00:00Z',
  },
];

export const MOCK_FINDINGS: Finding[] = [
  {
    id: 'FND-101',
    investigationId: 'INV-2025-001',
    title: 'Elementary Circuit: ACC-101 -> ACC-104 (4-Node Loop)',
    description: 'Cycle length 4 detected by Johnson algorithm with risk score 94 and retention ratio 92.7%.',
    severity: 'critical',
    status: 'confirmed',
    nodeIds: ['ACC-101', 'ACC-102', 'ACC-103', 'ACC-104'],
    edgeIds: ['TXN-101', 'TXN-102', 'TXN-103', 'TXN-104'],
    createdBy: 'System (Johnson Algorithm)',
    createdAt: '2025-03-10T15:45:00Z',
    updatedAt: '2025-03-10T15:45:00Z',
  },
  {
    id: 'FND-102',
    investigationId: 'INV-2025-001',
    title: 'Cross-Border Mule Hub Flagged on ACC-401',
    description: 'High betweenness centrality with significant bridging edges connecting cluster 1 and cluster 2.',
    severity: 'high',
    status: 'confirmed',
    nodeIds: ['ACC-401', 'ACC-101', 'ACC-402'],
    edgeIds: ['TXN-301', 'TXN-302'],
    createdBy: 'Marcus Vance',
    createdAt: '2025-03-10T17:15:00Z',
    updatedAt: '2025-03-10T17:15:00Z',
  },
];

export const MOCK_NOTES: Note[] = [
  {
    id: 'NOT-1',
    investigationId: 'INV-2025-001',
    content: 'Initial graph analysis confirms rapid turnaround time between TXN-101 and TXN-102 (< 68 minutes). Flagging ACC-103 to Compliance.',
    authorId: 'Sarah Lin',
    createdAt: '2025-03-10T16:20:00Z',
    updatedAt: '2025-03-10T16:20:00Z',
  },
  {
    id: 'NOT-2',
    investigationId: 'INV-2025-001',
    content: 'Corroborated with FinCEN SAR filings from preceding quarter. Multiple shell addresses match Panama offshore leaks.',
    authorId: 'Marcus Vance',
    createdAt: '2025-03-11T09:15:00Z',
    updatedAt: '2025-03-11T09:15:00Z',
  },
];
