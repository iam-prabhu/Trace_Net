import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { SAMPLE_USERS, SAMPLE_INVESTIGATIONS, SAMPLE_FINDINGS, SAMPLE_NOTES } from './seed_postgres.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types for dataset generation
export type AccountType = 'SAVINGS' | 'CHECKING' | 'BUSINESS' | 'INVESTMENT' | 'CRYPTO_WALLET' | 'SHELL_COMPANY';
export type AccountStatus = 'ACTIVE' | 'FLAGGED' | 'UNDER_REVIEW' | 'CLEARED';
export type TransactionType = 'WIRE' | 'ACH' | 'INTERNAL' | 'P2P' | 'SWIFT';
export type TransactionStatus = 'COMPLETED';

export interface AccountRecord {
  accountId: string;
  accountType: AccountType;
  riskScore: number;
  status: AccountStatus;
  balance: number;
  createdAt: string;
  ownerName: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface TransactionRecord {
  transactionId: string;
  senderAccountId: string;
  receiverAccountId: string;
  amount: number;
  timestamp: string;
  transactionType: TransactionType;
  status: TransactionStatus;
}

export interface PlantedCycle {
  id: string;
  name: string;
  patternType: 'CIRCULAR_ROUTING';
  hopCount: number;
  accounts: string[];
  transactionIds: string[];
  totalVolume: number;
  timeWindowHours: number;
  description: string;
}

export interface PlantedSmurfing {
  id: string;
  name: string;
  patternType: 'SMURFING_FAN_IN';
  aggregatorAccount: string;
  muleAccounts: string[];
  transactionIds: string[];
  totalVolume: number;
  threshold: number;
  timeWindowHours: number;
  description: string;
}

export interface PlantedDispersion {
  id: string;
  name: string;
  patternType: 'DISPERSION_FAN_OUT';
  sourceAccount: string;
  recipientAccounts: string[];
  transactionIds: string[];
  totalVolume: number;
  timeWindowHours: number;
  description: string;
}

export interface PlantedCommunity {
  id: string;
  name: string;
  patternType: 'COORDINATED_FRAUD_COMMUNITY';
  accounts: string[];
  transactionIds: string[];
  internalEdgeCount: number;
  totalVolume: number;
  description: string;
}

export interface PlantedLayering {
  id: string;
  name: string;
  patternType: 'MULTI_HOP_LAYERING';
  hopCount: number;
  chainAccounts: string[];
  transactionIds: string[];
  initialAmount: number;
  finalAmount: number;
  timeWindowHours: number;
  description: string;
}

export interface GroundTruthRegistry {
  generatedAt: string;
  summary: {
    totalAccounts: number;
    totalTransactions: number;
    fraudulentAccountsCount: number;
    fraudulentTransactionsCount: number;
  };
  patterns: {
    cycles: PlantedCycle[];
    smurfing: PlantedSmurfing[];
    dispersion: PlantedDispersion[];
    communities: PlantedCommunity[];
    layering: PlantedLayering[];
  };
  fraudulentAccountIds: string[];
  fraudulentTransactionIds: string[];
  accountLabels: Record<string, { isFraud: boolean; patternTypes: string[]; clusterId?: string }>;
  transactionLabels: Record<string, { isFraud: boolean; patternType: string }>;
}

export interface DefaultDataset {
  metadata: {
    datasetName: string;
    version: string;
    generatedAt: string;
    accountCount: number;
    transactionCount: number;
    description: string;
  };
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  }>;
  investigations: typeof SAMPLE_INVESTIGATIONS;
  findings: typeof SAMPLE_FINDINGS;
  notes: typeof SAMPLE_NOTES;
  accounts: AccountRecord[];
  transactions: TransactionRecord[];
  groundTruth: GroundTruthRegistry;
}

// Pseudo-random generator for repeatable, deterministic synthetic data
class SeededRandom {
  private seed: number;

  constructor(seed = 123456789) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  choice<T>(array: T[]): T {
    return array[this.rangeInt(0, array.length - 1)];
  }

  sample<T>(array: T[], count: number): T[] {
    const copy = [...array];
    const result: T[] = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = this.rangeInt(0, copy.length - 1);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }
}

const rng = new SeededRandom(42);

// Reference data for realistic synthesis
const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Alexander', 'Sophia', 'Victor', 'Elena', 'Dmitri', 'Natalia', 'Liam', 'Emma',
  'Noah', 'Olivia', 'Lucas', 'Mia', 'Mateo', 'Camila', 'Chen', 'Wei',
  'Mei', 'Hiroshi', 'Yuki', 'Kenji', 'Tariq', 'Fatima', 'Omar', 'Amina'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Ivanov', 'Petrov', 'Vance', 'Rostova', 'Zhang'
];

const CORP_PREFIXES = [
  'Apex', 'Vanguard', 'Omni', 'Summit', 'Global', 'Prime', 'Silverline', 'Horizon',
  'Crestview', 'Quantum', 'Nexus', 'Pinnacle', 'Sterling', 'Atlas', 'BlueHarbor',
  'Trident', 'Keystone', 'Beacon', 'Pacific', 'Atlantic', 'Meridian', 'Starlight'
];

const CORP_SUFFIXES = [
  'Capital LLC', 'Holdings Ltd', 'Ventures Group', 'Enterprises Inc', 'Global Logistics',
  'Financial Services', 'Trading Partners', 'International Corp', 'Solutions B.V.',
  'Offshore Asset Mgmt', 'Consulting Group', 'Commercial SA', 'Tech Innovations'
];

const COUNTRIES = [
  { code: 'US', weight: 45 },
  { code: 'GB', weight: 15 },
  { code: 'CA', weight: 8 },
  { code: 'DE', weight: 6 },
  { code: 'CH', weight: 5 },
  { code: 'SG', weight: 4 },
  { code: 'AU', weight: 4 },
  { code: 'KY', weight: 3 },
  { code: 'PA', weight: 3 },
  { code: 'HK', weight: 3 },
  { code: 'LU', weight: 2 },
  { code: 'BZ', weight: 2 }
];

function getRandomCountry(): string {
  const total = COUNTRIES.reduce((acc, c) => acc + c.weight, 0);
  let r = rng.range(0, total);
  for (const c of COUNTRIES) {
    if (r <= c.weight) return c.code;
    r -= c.weight;
  }
  return 'US';
}

function getRandomPersonName(): string {
  return `${rng.choice(FIRST_NAMES)} ${rng.choice(LAST_NAMES)}`;
}

function getRandomCorpName(): string {
  return `${rng.choice(CORP_PREFIXES)} ${rng.choice(CORP_SUFFIXES)}`;
}

// Generate realistic ISO date within the last N days
const NOW_MS = new Date('2026-11-16T12:00:00Z').getTime();

function getRandomPastDate(minDaysAgo: number, maxDaysAgo: number): string {
  const daysAgo = rng.range(minDaysAgo, maxDaysAgo);
  const ms = NOW_MS - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

export function generateFullDataset(): DefaultDataset {
  console.log('Generating collaborative fraud detection dataset...');

  const accounts: AccountRecord[] = [];
  const transactions: TransactionRecord[] = [];
  const accountsMap = new Map<string, AccountRecord>();

  // Ground truth tracking
  const groundTruth: GroundTruthRegistry = {
    generatedAt: new Date(NOW_MS).toISOString(),
    summary: {
      totalAccounts: 0,
      totalTransactions: 0,
      fraudulentAccountsCount: 0,
      fraudulentTransactionsCount: 0,
    },
    patterns: {
      cycles: [],
      smurfing: [],
      dispersion: [],
      communities: [],
      layering: [],
    },
    fraudulentAccountIds: [],
    fraudulentTransactionIds: [],
    accountLabels: {},
    transactionLabels: {},
  };

  function addAccount(acc: AccountRecord, isFraud = false, patternType?: string, clusterId?: string) {
    accounts.push(acc);
    accountsMap.set(acc.accountId, acc);

    if (isFraud) {
      if (!groundTruth.fraudulentAccountIds.includes(acc.accountId)) {
        groundTruth.fraudulentAccountIds.push(acc.accountId);
      }
    }

    const current = groundTruth.accountLabels[acc.accountId] || {
      isFraud,
      patternTypes: [],
      clusterId,
    };
    if (isFraud) current.isFraud = true;
    if (patternType && !current.patternTypes.includes(patternType)) {
      current.patternTypes.push(patternType);
    }
    if (clusterId) current.clusterId = clusterId;
    groundTruth.accountLabels[acc.accountId] = current;
  }

  function addTransaction(txn: TransactionRecord, isFraud = false, patternType = 'NORMAL') {
    transactions.push(txn);
    if (isFraud) {
      if (!groundTruth.fraudulentTransactionIds.includes(txn.transactionId)) {
        groundTruth.fraudulentTransactionIds.push(txn.transactionId);
      }
    }
    groundTruth.transactionLabels[txn.transactionId] = {
      isFraud,
      patternType,
    };
  }

  // =========================================================================
  // 1. PLANT PATTERN A: CIRCULAR FUND ROUTING (CYCLES)
  // =========================================================================

  // --- Cycle 1: 3-Hop Cycle ---
  // ACC-CYCLE-01 -> ACC-CYCLE-02 -> ACC-CYCLE-03 -> ACC-CYCLE-01
  const cycle1Accs: AccountRecord[] = [
    {
      accountId: 'ACC-CYCLE-01',
      accountType: 'SHELL_COMPANY',
      riskScore: 88,
      status: 'FLAGGED',
      balance: 142500.00,
      createdAt: getRandomPastDate(300, 500),
      ownerName: 'Panama Meridian Holdings SA',
      country: 'PA',
      email: 'finance@panamameridian.pa',
    },
    {
      accountId: 'ACC-CYCLE-02',
      accountType: 'INVESTMENT',
      riskScore: 84,
      status: 'FLAGGED',
      balance: 215300.00,
      createdAt: getRandomPastDate(250, 450),
      ownerName: 'Cayman Horizon Fund LP',
      country: 'KY',
      email: 'treasury@caymanhorizon.ky',
    },
    {
      accountId: 'ACC-CYCLE-03',
      accountType: 'BUSINESS',
      riskScore: 82,
      status: 'UNDER_REVIEW',
      balance: 98400.00,
      createdAt: getRandomPastDate(200, 400),
      ownerName: 'Helvetia Trade Consult GmbH',
      country: 'CH',
      email: 'ops@helvetiatrade.ch',
    },
  ];

  cycle1Accs.forEach(acc => addAccount(acc, true, 'CIRCULAR_ROUTING', 'cycle_3hop_1'));

  const c1BaseTime = NOW_MS - 25 * 24 * 60 * 60 * 1000; // 25 days ago
  const c1Txns: TransactionRecord[] = [
    {
      transactionId: 'TXN-CYC1-001',
      senderAccountId: 'ACC-CYCLE-01',
      receiverAccountId: 'ACC-CYCLE-02',
      amount: 48500.00,
      timestamp: new Date(c1BaseTime).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC1-002',
      senderAccountId: 'ACC-CYCLE-02',
      receiverAccountId: 'ACC-CYCLE-03',
      amount: 47200.00,
      timestamp: new Date(c1BaseTime + 8 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC1-003',
      senderAccountId: 'ACC-CYCLE-03',
      receiverAccountId: 'ACC-CYCLE-01',
      amount: 46000.00,
      timestamp: new Date(c1BaseTime + 22 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
  ];

  c1Txns.forEach(tx => addTransaction(tx, true, 'CIRCULAR_ROUTING'));

  groundTruth.patterns.cycles.push({
    id: 'cycle_3hop_1',
    name: '3-Hop Circular Layering Loop (Panama-Cayman-Swiss)',
    patternType: 'CIRCULAR_ROUTING',
    hopCount: 3,
    accounts: ['ACC-CYCLE-01', 'ACC-CYCLE-02', 'ACC-CYCLE-03'],
    transactionIds: c1Txns.map(t => t.transactionId),
    totalVolume: 48500 + 47200 + 46000,
    timeWindowHours: 22,
    description: 'Closed circular loop moving $48.5k through 3 offshore entities with ~2.5% fee depletion per hop.',
  });

  // --- Cycle 2: 4-Hop Cycle ---
  // ACC-RING-01 -> ACC-RING-02 -> ACC-RING-03 -> ACC-RING-04 -> ACC-RING-01
  const cycle2Accs: AccountRecord[] = [
    {
      accountId: 'ACC-RING-01',
      accountType: 'SHELL_COMPANY',
      riskScore: 91,
      status: 'FLAGGED',
      balance: 310500.00,
      createdAt: getRandomPastDate(350, 600),
      ownerName: 'Belize BlueHarbor International',
      country: 'BZ',
    },
    {
      accountId: 'ACC-RING-02',
      accountType: 'CRYPTO_WALLET',
      riskScore: 89,
      status: 'FLAGGED',
      balance: 85200.00,
      createdAt: getRandomPastDate(150, 300),
      ownerName: 'Seychelles Apex Vault 0x4B2',
      country: 'SC',
    },
    {
      accountId: 'ACC-RING-03',
      accountType: 'BUSINESS',
      riskScore: 85,
      status: 'UNDER_REVIEW',
      balance: 145000.00,
      createdAt: getRandomPastDate(200, 450),
      ownerName: 'Cyprus Maritime Trading Ltd',
      country: 'CY',
    },
    {
      accountId: 'ACC-RING-04',
      accountType: 'CHECKING',
      riskScore: 81,
      status: 'UNDER_REVIEW',
      balance: 112000.00,
      createdAt: getRandomPastDate(180, 400),
      ownerName: 'Valletta Merchant Escrow Account',
      country: 'MT',
    },
  ];

  cycle2Accs.forEach(acc => addAccount(acc, true, 'CIRCULAR_ROUTING', 'cycle_4hop_1'));

  const c2BaseTime = NOW_MS - 40 * 24 * 60 * 60 * 1000; // 40 days ago
  const c2Txns: TransactionRecord[] = [
    {
      transactionId: 'TXN-CYC2-001',
      senderAccountId: 'ACC-RING-01',
      receiverAccountId: 'ACC-RING-02',
      amount: 85000.00,
      timestamp: new Date(c2BaseTime).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC2-002',
      senderAccountId: 'ACC-RING-02',
      receiverAccountId: 'ACC-RING-03',
      amount: 83300.00,
      timestamp: new Date(c2BaseTime + 10 * 3600 * 1000).toISOString(),
      transactionType: 'INTERNAL',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC2-003',
      senderAccountId: 'ACC-RING-03',
      receiverAccountId: 'ACC-RING-04',
      amount: 81800.00,
      timestamp: new Date(c2BaseTime + 24 * 3600 * 1000).toISOString(),
      transactionType: 'SWIFT',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC2-004',
      senderAccountId: 'ACC-RING-04',
      receiverAccountId: 'ACC-RING-01',
      amount: 80200.00,
      timestamp: new Date(c2BaseTime + 38 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
  ];

  c2Txns.forEach(tx => addTransaction(tx, true, 'CIRCULAR_ROUTING'));

  groundTruth.patterns.cycles.push({
    id: 'cycle_4hop_1',
    name: '4-Hop Cross-Border Crypto-Fiat Roundtrip',
    patternType: 'CIRCULAR_ROUTING',
    hopCount: 4,
    accounts: ['ACC-RING-01', 'ACC-RING-02', 'ACC-RING-03', 'ACC-RING-04'],
    transactionIds: c2Txns.map(t => t.transactionId),
    totalVolume: 85000 + 83300 + 81800 + 80200,
    timeWindowHours: 38,
    description: '4-stage cross-border carousel cycling $85k through shell company, crypto exchange, and European escrow.',
  });

  // --- Cycle 3: 5-Hop Cycle ---
  // ACC-CIRC-01 -> ACC-CIRC-02 -> ACC-CIRC-03 -> ACC-CIRC-04 -> ACC-CIRC-05 -> ACC-CIRC-01
  const cycle3Accs: AccountRecord[] = [
    {
      accountId: 'ACC-CIRC-01',
      accountType: 'SHELL_COMPANY',
      riskScore: 93,
      status: 'FLAGGED',
      balance: 420000.00,
      createdAt: getRandomPastDate(400, 700),
      ownerName: 'Tortola Atlantic Nominees BVI',
      country: 'VG',
    },
    {
      accountId: 'ACC-CIRC-02',
      accountType: 'INVESTMENT',
      riskScore: 86,
      status: 'FLAGGED',
      balance: 180000.00,
      createdAt: getRandomPastDate(300, 500),
      ownerName: 'Vaduz Alpine Capital Anstalt',
      country: 'LI',
    },
    {
      accountId: 'ACC-CIRC-03',
      accountType: 'BUSINESS',
      riskScore: 79,
      status: 'UNDER_REVIEW',
      balance: 290000.00,
      createdAt: getRandomPastDate(250, 450),
      ownerName: 'Luxembourg EuroFin Holdings SARL',
      country: 'LU',
    },
    {
      accountId: 'ACC-CIRC-04',
      accountType: 'CHECKING',
      riskScore: 78,
      status: 'UNDER_REVIEW',
      balance: 165000.00,
      createdAt: getRandomPastDate(200, 400),
      ownerName: 'London City Commodities Ltd',
      country: 'GB',
    },
    {
      accountId: 'ACC-CIRC-05',
      accountType: 'SAVINGS',
      riskScore: 76,
      status: 'ACTIVE',
      balance: 135000.00,
      createdAt: getRandomPastDate(180, 350),
      ownerName: 'Singapore Pacific Vault Pte Ltd',
      country: 'SG',
    },
  ];

  cycle3Accs.forEach(acc => addAccount(acc, true, 'CIRCULAR_ROUTING', 'cycle_5hop_1'));

  const c3BaseTime = NOW_MS - 55 * 24 * 60 * 60 * 1000; // 55 days ago
  const c3Txns: TransactionRecord[] = [
    {
      transactionId: 'TXN-CYC3-001',
      senderAccountId: 'ACC-CIRC-01',
      receiverAccountId: 'ACC-CIRC-02',
      amount: 125000.00,
      timestamp: new Date(c3BaseTime).toISOString(),
      transactionType: 'SWIFT',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC3-002',
      senderAccountId: 'ACC-CIRC-02',
      receiverAccountId: 'ACC-CIRC-03',
      amount: 122800.00,
      timestamp: new Date(c3BaseTime + 12 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC3-003',
      senderAccountId: 'ACC-CIRC-03',
      receiverAccountId: 'ACC-CIRC-04',
      amount: 120500.00,
      timestamp: new Date(c3BaseTime + 26 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC3-004',
      senderAccountId: 'ACC-CIRC-04',
      receiverAccountId: 'ACC-CIRC-05',
      amount: 118700.00,
      timestamp: new Date(c3BaseTime + 42 * 3600 * 1000).toISOString(),
      transactionType: 'ACH',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-CYC3-005',
      senderAccountId: 'ACC-CIRC-05',
      receiverAccountId: 'ACC-CIRC-01',
      amount: 116900.00,
      timestamp: new Date(c3BaseTime + 58 * 3600 * 1000).toISOString(),
      transactionType: 'SWIFT',
      status: 'COMPLETED',
    },
  ];

  c3Txns.forEach(tx => addTransaction(tx, true, 'CIRCULAR_ROUTING'));

  groundTruth.patterns.cycles.push({
    id: 'cycle_5hop_1',
    name: '5-Hop Global Multi-Jurisdiction Circular Ring',
    patternType: 'CIRCULAR_ROUTING',
    hopCount: 5,
    accounts: ['ACC-CIRC-01', 'ACC-CIRC-02', 'ACC-CIRC-03', 'ACC-CIRC-04', 'ACC-CIRC-05'],
    transactionIds: c3Txns.map(t => t.transactionId),
    totalVolume: 125000 + 122800 + 120500 + 118700 + 116900,
    timeWindowHours: 58,
    description: 'Complex 5-jurisdiction circular layering washing $125k back to originator through BVI-Liechtenstein-Luxembourg-London-Singapore.',
  });

  // =========================================================================
  // 2. PLANT PATTERN B: SMURFING / STRUCTURING (FAN-IN)
  // =========================================================================
  // 10 mule accounts depositing amounts under $10,000 threshold to single aggregator within 48h
  const smurfAggregator: AccountRecord = {
    accountId: 'ACC-SMURF-AGG-01',
    accountType: 'BUSINESS',
    riskScore: 92,
    status: 'FLAGGED',
    balance: 284000.00,
    createdAt: getRandomPastDate(120, 240),
    ownerName: 'Consolidated Wholesale Imports LLC',
    country: 'US',
    email: 'treasury@consolidatedimports.us',
  };
  addAccount(smurfAggregator, true, 'SMURFING_FAN_IN', 'smurf_fanin_1');

  const smurfMules: AccountRecord[] = [];
  const smurfTxns: TransactionRecord[] = [];
  const smurfBaseTime = NOW_MS - 14 * 24 * 60 * 60 * 1000; // 14 days ago
  const smurfAmounts = [9200.00, 9450.00, 9800.00, 9150.00, 9900.00, 9350.00, 9750.00, 9600.00, 9850.00, 9400.00];

  for (let i = 1; i <= 10; i++) {
    const muleId = `ACC-SMURF-${String(i).padStart(2, '0')}`;
    const muleAcc: AccountRecord = {
      accountId: muleId,
      accountType: rng.choice(['CHECKING', 'SAVINGS', 'P2P'] as any) === 'SAVINGS' ? 'SAVINGS' : 'CHECKING',
      riskScore: rng.rangeInt(72, 88),
      status: 'UNDER_REVIEW',
      balance: rng.rangeInt(1500, 12000),
      createdAt: getRandomPastDate(60, 180),
      ownerName: getRandomPersonName(),
      country: 'US',
    };
    smurfMules.push(muleAcc);
    addAccount(muleAcc, true, 'SMURFING_FAN_IN', 'smurf_fanin_1');

    const txId = `TXN-SMURF-${String(i).padStart(3, '0')}`;
    const offsetHours = rng.range(1, 46);
    const tx: TransactionRecord = {
      transactionId: txId,
      senderAccountId: muleId,
      receiverAccountId: 'ACC-SMURF-AGG-01',
      amount: smurfAmounts[i - 1],
      timestamp: new Date(smurfBaseTime + offsetHours * 3600 * 1000).toISOString(),
      transactionType: rng.choice(['P2P', 'ACH', 'INTERNAL']),
      status: 'COMPLETED',
    };
    smurfTxns.push(tx);
    addTransaction(tx, true, 'SMURFING_FAN_IN');
  }

  const smurfTotal = smurfAmounts.reduce((a, b) => a + b, 0);
  groundTruth.patterns.smurfing.push({
    id: 'smurf_fanin_1',
    name: 'Sub-Threshold Mule Influx Fan-In (10 Mules -> 1 Aggregator)',
    patternType: 'SMURFING_FAN_IN',
    aggregatorAccount: 'ACC-SMURF-AGG-01',
    muleAccounts: smurfMules.map(m => m.accountId),
    transactionIds: smurfTxns.map(t => t.transactionId),
    totalVolume: smurfTotal,
    threshold: 10000.00,
    timeWindowHours: 48,
    description: 'Classic structuring pattern: 10 individual mule accounts depositing amounts between $9,150 and $9,900 (under BSA $10k CTR limit) to single aggregator in 48 hours.',
  });

  // =========================================================================
  // 3. PLANT PATTERN C: DISPERSION (FAN-OUT)
  // =========================================================================
  // Single corporate account rapidly distributing funds to 15 different accounts in 24 hours
  const dispSource: AccountRecord = {
    accountId: 'ACC-DISP-SRC-01',
    accountType: 'BUSINESS',
    riskScore: 89,
    status: 'FLAGGED',
    balance: 512000.00,
    createdAt: getRandomPastDate(180, 360),
    ownerName: 'Vanguard Global Distribution Ltd',
    country: 'US',
  };
  addAccount(dispSource, true, 'DISPERSION_FAN_OUT', 'dispersion_fanout_1');

  const dispRecipients: AccountRecord[] = [];
  const dispTxns: TransactionRecord[] = [];
  const dispBaseTime = NOW_MS - 8 * 24 * 60 * 60 * 1000; // 8 days ago
  let dispTotal = 0;

  for (let i = 1; i <= 15; i++) {
    const recId = `ACC-DISP-${String(i).padStart(2, '0')}`;
    const recAcc: AccountRecord = {
      accountId: recId,
      accountType: rng.choice(['CHECKING', 'SAVINGS', 'CRYPTO_WALLET']),
      riskScore: rng.rangeInt(65, 82),
      status: 'ACTIVE',
      balance: rng.rangeInt(3000, 25000),
      createdAt: getRandomPastDate(90, 240),
      ownerName: getRandomPersonName(),
      country: rng.choice(['US', 'MX', 'CA', 'GB']),
    };
    dispRecipients.push(recAcc);
    addAccount(recAcc, true, 'DISPERSION_FAN_OUT', 'dispersion_fanout_1');

    const txId = `TXN-DISP-${String(i).padStart(3, '0')}`;
    const amount = Number((rng.range(4500, 8200)).toFixed(2));
    dispTotal += amount;
    const offsetHours = rng.range(0.5, 23.5);
    const tx: TransactionRecord = {
      transactionId: txId,
      senderAccountId: 'ACC-DISP-SRC-01',
      receiverAccountId: recId,
      amount,
      timestamp: new Date(dispBaseTime + offsetHours * 3600 * 1000).toISOString(),
      transactionType: rng.choice(['WIRE', 'ACH', 'P2P']),
      status: 'COMPLETED',
    };
    dispTxns.push(tx);
    addTransaction(tx, true, 'DISPERSION_FAN_OUT');
  }

  groundTruth.patterns.dispersion.push({
    id: 'dispersion_fanout_1',
    name: 'Rapid High-Velocity Dispersion Fan-Out (1 Source -> 15 Beneficiaries)',
    patternType: 'DISPERSION_FAN_OUT',
    sourceAccount: 'ACC-DISP-SRC-01',
    recipientAccounts: dispRecipients.map(r => r.accountId),
    transactionIds: dispTxns.map(t => t.transactionId),
    totalVolume: Number(dispTotal.toFixed(2)),
    timeWindowHours: 24,
    description: 'Corporate hub account dishing out 15 rapid outgoing transfers totaling ~$95k within 24 hours to disperse funds.',
  });

  // =========================================================================
  // 4. PLANT PATTERN D: DENSE COORDINATED FRAUD COMMUNITIES
  // =========================================================================

  // --- Community 1: 10 Accounts, 28 internal dense edges ---
  const comm1Accs: AccountRecord[] = [];
  const comm1Txns: TransactionRecord[] = [];
  let comm1Volume = 0;
  const comm1BaseTime = NOW_MS - 30 * 24 * 60 * 60 * 1000; // 30 days ago

  for (let i = 1; i <= 10; i++) {
    const accId = `ACC-COMM1-${String(i).padStart(2, '0')}`;
    const acc: AccountRecord = {
      accountId: accId,
      accountType: rng.choice(['SHELL_COMPANY', 'BUSINESS', 'CRYPTO_WALLET']),
      riskScore: rng.rangeInt(78, 94),
      status: rng.choice(['FLAGGED', 'UNDER_REVIEW']),
      balance: rng.rangeInt(50000, 320000),
      createdAt: getRandomPastDate(180, 500),
      ownerName: i % 2 === 0 ? getRandomCorpName() : getRandomPersonName(),
      country: rng.choice(['PA', 'KY', 'BZ', 'VG', 'CH', 'US']),
    };
    comm1Accs.push(acc);
    addAccount(acc, true, 'COORDINATED_FRAUD_COMMUNITY', 'fraud_community_1');
  }

  // Generate 28 directed transactions between pairs
  const comm1Edges = new Set<string>();
  let comm1TxCounter = 1;
  while (comm1Txns.length < 28) {
    const u = rng.rangeInt(0, 9);
    let v = rng.rangeInt(0, 9);
    while (v === u) v = rng.rangeInt(0, 9);
    const key = `${u}->${v}`;
    // Allow multiple transactions over different days or distinct edges
    if (!comm1Edges.has(key) || comm1Txns.length > 20) {
      comm1Edges.add(key);
      const amount = Number(rng.range(15000, 65000).toFixed(2));
      comm1Volume += amount;
      const dayOffset = rng.range(0, 14);
      const hourOffset = rng.range(0, 24);
      const tx: TransactionRecord = {
        transactionId: `TXN-COMM1-${String(comm1TxCounter++).padStart(3, '0')}`,
        senderAccountId: comm1Accs[u].accountId,
        receiverAccountId: comm1Accs[v].accountId,
        amount,
        timestamp: new Date(comm1BaseTime + (dayOffset * 24 + hourOffset) * 3600 * 1000).toISOString(),
        transactionType: rng.choice(['WIRE', 'SWIFT', 'INTERNAL']),
        status: 'COMPLETED',
      };
      comm1Txns.push(tx);
      addTransaction(tx, true, 'COORDINATED_FRAUD_COMMUNITY');
    }
  }

  groundTruth.patterns.communities.push({
    id: 'fraud_community_1',
    name: 'Dense Offshore Shell Coordinated Ring Alpha (10 nodes, 28 internal edges)',
    patternType: 'COORDINATED_FRAUD_COMMUNITY',
    accounts: comm1Accs.map(a => a.accountId),
    transactionIds: comm1Txns.map(t => t.transactionId),
    internalEdgeCount: comm1Txns.length,
    totalVolume: Number(comm1Volume.toFixed(2)),
    description: '10 tightly interconnected offshore entities with heavy internal transaction volume and extremely high local clustering coefficient.',
  });

  // --- Community 2: 12 Accounts, 38 internal dense edges ---
  const comm2Accs: AccountRecord[] = [];
  const comm2Txns: TransactionRecord[] = [];
  let comm2Volume = 0;
  const comm2BaseTime = NOW_MS - 45 * 24 * 60 * 60 * 1000; // 45 days ago

  for (let i = 1; i <= 12; i++) {
    const accId = `ACC-COMM2-${String(i).padStart(2, '0')}`;
    const acc: AccountRecord = {
      accountId: accId,
      accountType: rng.choice(['BUSINESS', 'INVESTMENT', 'CRYPTO_WALLET', 'CHECKING']),
      riskScore: rng.rangeInt(75, 92),
      status: rng.choice(['FLAGGED', 'UNDER_REVIEW']),
      balance: rng.rangeInt(70000, 450000),
      createdAt: getRandomPastDate(200, 600),
      ownerName: i % 2 === 0 ? getRandomCorpName() : getRandomPersonName(),
      country: rng.choice(['CY', 'MT', 'SG', 'HK', 'GB', 'DE']),
    };
    comm2Accs.push(acc);
    addAccount(acc, true, 'COORDINATED_FRAUD_COMMUNITY', 'fraud_community_2');
  }

  let comm2TxCounter = 1;
  const comm2Edges = new Set<string>();
  while (comm2Txns.length < 38) {
    const u = rng.rangeInt(0, 11);
    let v = rng.rangeInt(0, 11);
    while (v === u) v = rng.rangeInt(0, 11);
    const key = `${u}->${v}`;
    if (!comm2Edges.has(key) || comm2Txns.length > 25) {
      comm2Edges.add(key);
      const amount = Number(rng.range(20000, 75000).toFixed(2));
      comm2Volume += amount;
      const dayOffset = rng.range(0, 21);
      const hourOffset = rng.range(0, 24);
      const tx: TransactionRecord = {
        transactionId: `TXN-COMM2-${String(comm2TxCounter++).padStart(3, '0')}`,
        senderAccountId: comm2Accs[u].accountId,
        receiverAccountId: comm2Accs[v].accountId,
        amount,
        timestamp: new Date(comm2BaseTime + (dayOffset * 24 + hourOffset) * 3600 * 1000).toISOString(),
        transactionType: rng.choice(['WIRE', 'SWIFT', 'INTERNAL']),
        status: 'COMPLETED',
      };
      comm2Txns.push(tx);
      addTransaction(tx, true, 'COORDINATED_FRAUD_COMMUNITY');
    }
  }

  groundTruth.patterns.communities.push({
    id: 'fraud_community_2',
    name: 'High-Density Mediterranean-Asian Syndicate Beta (12 nodes, 38 internal edges)',
    patternType: 'COORDINATED_FRAUD_COMMUNITY',
    accounts: comm2Accs.map(a => a.accountId),
    transactionIds: comm2Txns.map(t => t.transactionId),
    internalEdgeCount: comm2Txns.length,
    totalVolume: Number(comm2Volume.toFixed(2)),
    description: '12-node coordinated syndicate moving high capital through Cyprus, Malta, Singapore and Hong Kong with dense mesh topology.',
  });

  // =========================================================================
  // 5. PLANT PATTERN E: MULTI-HOP LINEAR LAYERING CHAIN (5 HOPS)
  // =========================================================================
  // ACC-LAYER-01 -> ACC-LAYER-02 -> ACC-LAYER-03 -> ACC-LAYER-04 -> ACC-LAYER-05 -> ACC-LAYER-06
  const layerAccs: AccountRecord[] = [
    {
      accountId: 'ACC-LAYER-01',
      accountType: 'SHELL_COMPANY',
      riskScore: 95,
      status: 'FLAGGED',
      balance: 620000.00,
      createdAt: getRandomPastDate(300, 600),
      ownerName: 'Orion Sovereign Trust BVI',
      country: 'VG',
      email: 'trustee@oriontrust.vg',
    },
    {
      accountId: 'ACC-LAYER-02',
      accountType: 'INVESTMENT',
      riskScore: 88,
      status: 'FLAGGED',
      balance: 340000.00,
      createdAt: getRandomPastDate(250, 500),
      ownerName: 'Panama Pacific Capital Inc',
      country: 'PA',
    },
    {
      accountId: 'ACC-LAYER-03',
      accountType: 'CRYPTO_WALLET',
      riskScore: 87,
      status: 'UNDER_REVIEW',
      balance: 195000.00,
      createdAt: getRandomPastDate(150, 350),
      ownerName: 'Crypto Clearing Node 0x7E3',
      country: 'CH',
    },
    {
      accountId: 'ACC-LAYER-04',
      accountType: 'BUSINESS',
      riskScore: 83,
      status: 'UNDER_REVIEW',
      balance: 275000.00,
      createdAt: getRandomPastDate(200, 400),
      ownerName: 'Straits Meridian Logistics Pte',
      country: 'SG',
    },
    {
      accountId: 'ACC-LAYER-05',
      accountType: 'SHELL_COMPANY',
      riskScore: 86,
      status: 'FLAGGED',
      balance: 180000.00,
      createdAt: getRandomPastDate(180, 380),
      ownerName: 'Belize Ambergris International',
      country: 'BZ',
    },
    {
      accountId: 'ACC-LAYER-06',
      accountType: 'BUSINESS',
      riskScore: 78,
      status: 'UNDER_REVIEW',
      balance: 310000.00,
      createdAt: getRandomPastDate(220, 450),
      ownerName: 'Atlantic Rim Import & Export LLC',
      country: 'US',
    },
  ];

  layerAccs.forEach(acc => addAccount(acc, true, 'MULTI_HOP_LAYERING', 'layering_linear_1'));

  const layerBaseTime = NOW_MS - 20 * 24 * 60 * 60 * 1000; // 20 days ago
  const layerTxns: TransactionRecord[] = [
    {
      transactionId: 'TXN-LAYR-001',
      senderAccountId: 'ACC-LAYER-01',
      receiverAccountId: 'ACC-LAYER-02',
      amount: 250000.00,
      timestamp: new Date(layerBaseTime).toISOString(),
      transactionType: 'SWIFT',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-LAYR-002',
      senderAccountId: 'ACC-LAYER-02',
      receiverAccountId: 'ACC-LAYER-03',
      amount: 246250.00,
      timestamp: new Date(layerBaseTime + 6 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-LAYR-003',
      senderAccountId: 'ACC-LAYER-03',
      receiverAccountId: 'ACC-LAYER-04',
      amount: 242500.00,
      timestamp: new Date(layerBaseTime + 15 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-LAYR-004',
      senderAccountId: 'ACC-LAYER-04',
      receiverAccountId: 'ACC-LAYER-05',
      amount: 238800.00,
      timestamp: new Date(layerBaseTime + 27 * 3600 * 1000).toISOString(),
      transactionType: 'SWIFT',
      status: 'COMPLETED',
    },
    {
      transactionId: 'TXN-LAYR-005',
      senderAccountId: 'ACC-LAYER-05',
      receiverAccountId: 'ACC-LAYER-06',
      amount: 235200.00,
      timestamp: new Date(layerBaseTime + 41 * 3600 * 1000).toISOString(),
      transactionType: 'WIRE',
      status: 'COMPLETED',
    },
  ];

  layerTxns.forEach(tx => addTransaction(tx, true, 'MULTI_HOP_LAYERING'));

  groundTruth.patterns.layering.push({
    id: 'layering_linear_1',
    name: '5-Hop High-Value Capital Layering Corridor',
    patternType: 'MULTI_HOP_LAYERING',
    hopCount: 5,
    chainAccounts: layerAccs.map(a => a.accountId),
    transactionIds: layerTxns.map(t => t.transactionId),
    initialAmount: 250000.00,
    finalAmount: 235200.00,
    timeWindowHours: 41,
    description: 'Linear 5-hop wire chain transferring $250k through 4 international intermediary jurisdictions, peeling off 1.5% fee per hop.',
  });

  // =========================================================================
  // 6. GENERATE BACKGROUND NORMAL ACCOUNTS
  // =========================================================================
  // We currently have:
  // 3 (cycle1) + 4 (cycle2) + 5 (cycle3) + 11 (smurf) + 16 (disp) + 10 (comm1) + 12 (comm2) + 6 (layer) = 67 planted
  // Total target accounts: 700 (within 600 - 800) -> 633 background accounts.
  const TARGET_TOTAL_ACCOUNTS = 700;
  const backgroundAccountCount = TARGET_TOTAL_ACCOUNTS - accounts.length;

  console.log(`Planted accounts: ${accounts.length}. Generating ${backgroundAccountCount} background accounts...`);

  const normalAccounts: AccountRecord[] = [];

  for (let i = 1; i <= backgroundAccountCount; i++) {
    const accId = `ACC-${String(100000 + i)}`;
    const accTypeRand = rng.next();
    let accountType: AccountType = 'CHECKING';
    if (accTypeRand < 0.45) accountType = 'CHECKING';
    else if (accTypeRand < 0.75) accountType = 'SAVINGS';
    else if (accTypeRand < 0.92) accountType = 'BUSINESS';
    else if (accTypeRand < 0.97) accountType = 'INVESTMENT';
    else if (accTypeRand < 0.99) accountType = 'CRYPTO_WALLET';
    else accountType = 'SHELL_COMPANY';

    // Normal risk distribution: mostly low risk (0 - 35)
    let riskScore: number;
    let status: AccountStatus = 'ACTIVE';
    const riskRand = rng.next();
    if (riskRand < 0.82) {
      riskScore = rng.rangeInt(5, 30);
      status = 'ACTIVE';
    } else if (riskRand < 0.94) {
      riskScore = rng.rangeInt(31, 55);
      status = 'ACTIVE';
    } else if (riskRand < 0.98) {
      riskScore = rng.rangeInt(56, 70);
      status = 'UNDER_REVIEW';
    } else {
      riskScore = rng.rangeInt(10, 25);
      status = 'CLEARED';
    }

    const balance = Number((Math.pow(10, rng.range(2.8, 5.4))).toFixed(2));
    const ownerName = accountType === 'BUSINESS' || accountType === 'SHELL_COMPANY'
      ? getRandomCorpName()
      : getRandomPersonName();

    const acc: AccountRecord = {
      accountId: accId,
      accountType,
      riskScore,
      status,
      balance,
      createdAt: getRandomPastDate(90, 730),
      ownerName,
      country: getRandomCountry(),
    };

    normalAccounts.push(acc);
    addAccount(acc, false);
  }

  // =========================================================================
  // 7. GENERATE BACKGROUND NORMAL TRANSACTIONS
  // =========================================================================
  // Currently planted transactions = 3 + 4 + 5 + 10 + 15 + 28 + 38 + 5 = 108
  // Target total transactions: ~3,200 (within 2,500 - 4,000)
  const TARGET_TOTAL_TXNS = 3200;
  const backgroundTxnCount = TARGET_TOTAL_TXNS - transactions.length;

  console.log(`Planted transactions: ${transactions.length}. Generating ${backgroundTxnCount} background transactions...`);

  // To prevent creating accidental spurious cycles or weird dense loops in background:
  // We select senders and receivers primarily from normal accounts, with timestamps spread over 90 days.
  for (let i = 1; i <= backgroundTxnCount; i++) {
    const txId = `TXN-${String(100000 + i)}`;

    // Pick sender and receiver from normal accounts (with 5% chance of picking a planted account to create natural background noise)
    const senderAcc = (rng.next() < 0.05) ? rng.choice(accounts) : rng.choice(normalAccounts);
    let receiverAcc = rng.choice(normalAccounts);
    while (receiverAcc.accountId === senderAcc.accountId) {
      receiverAcc = rng.choice(normalAccounts);
    }

    // Amount: realistic distribution
    let amount: number;
    const amtRand = rng.next();
    if (amtRand < 0.65) {
      amount = Number(rng.range(15, 850).toFixed(2));
    } else if (amtRand < 0.88) {
      amount = Number(rng.range(850, 4800).toFixed(2));
    } else if (amtRand < 0.97) {
      amount = Number(rng.range(4800, 18500).toFixed(2));
    } else {
      amount = Number(rng.range(18500, 62000).toFixed(2));
    }

    // Transaction type
    let transactionType: TransactionType = 'ACH';
    const typeRand = rng.next();
    if (typeRand < 0.45) transactionType = 'ACH';
    else if (typeRand < 0.70) transactionType = 'P2P';
    else if (typeRand < 0.88) transactionType = 'WIRE';
    else if (typeRand < 0.95) transactionType = 'INTERNAL';
    else transactionType = 'SWIFT';

    // Timestamp in last 90 days
    const daysAgo = rng.range(0.1, 89.9);
    const txTime = new Date(NOW_MS - daysAgo * 24 * 3600 * 1000).toISOString();

    const tx: TransactionRecord = {
      transactionId: txId,
      senderAccountId: senderAcc.accountId,
      receiverAccountId: receiverAcc.accountId,
      amount,
      timestamp: txTime,
      transactionType,
      status: 'COMPLETED',
    };

    addTransaction(tx, false, 'NORMAL');
  }

  // Final summary stats
  groundTruth.summary.totalAccounts = accounts.length;
  groundTruth.summary.totalTransactions = transactions.length;
  groundTruth.summary.fraudulentAccountsCount = groundTruth.fraudulentAccountIds.length;
  groundTruth.summary.fraudulentTransactionsCount = groundTruth.fraudulentTransactionIds.length;

  console.log(`Generated ${accounts.length} total accounts (${groundTruth.summary.fraudulentAccountsCount} fraudulent)`);
  console.log(`Generated ${transactions.length} total transactions (${groundTruth.summary.fraudulentTransactionsCount} fraudulent)`);

  // Pre-hashed users for in-memory and static DB loading
  const preparedUsers = SAMPLE_USERS.map((u) => ({
    id: u.id,
    email: u.email,
    passwordHash: bcrypt.hashSync(u.password, 10),
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    isActive: true,
  }));

  const fullDataset: DefaultDataset = {
    metadata: {
      datasetName: 'Collaborative Fraud Detection Default Network',
      version: '1.0.0',
      generatedAt: new Date(NOW_MS).toISOString(),
      accountCount: accounts.length,
      transactionCount: transactions.length,
      description: 'Comprehensive synthetic graph banking dataset with planted ground-truth cycles, smurfing, dispersion, communities, and layering.',
    },
    users: preparedUsers,
    investigations: SAMPLE_INVESTIGATIONS,
    findings: SAMPLE_FINDINGS,
    notes: SAMPLE_NOTES,
    accounts,
    transactions,
    groundTruth,
  };

  return fullDataset;
}

// Convert accounts to CSV
export function accountsToCsv(accounts: AccountRecord[]): string {
  const headers = ['accountId', 'accountType', 'riskScore', 'status', 'balance', 'createdAt', 'ownerName', 'country'];
  const lines = [headers.join(',')];

  for (const acc of accounts) {
    const row = [
      acc.accountId,
      acc.accountType,
      acc.riskScore,
      acc.status,
      acc.balance.toFixed(2),
      acc.createdAt,
      `"${acc.ownerName.replace(/"/g, '""')}"`,
      acc.country,
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

// Convert transactions to CSV
export function transactionsToCsv(transactions: TransactionRecord[]): string {
  const headers = ['transactionId', 'senderAccountId', 'receiverAccountId', 'amount', 'timestamp', 'transactionType', 'status'];
  const lines = [headers.join(',')];

  for (const tx of transactions) {
    const row = [
      tx.transactionId,
      tx.senderAccountId,
      tx.receiverAccountId,
      tx.amount.toFixed(2),
      tx.timestamp,
      tx.transactionType,
      tx.status,
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

// Template CSV for Data Management upload page
export function createTemplateCsv(): string {
  const headers = ['transaction_id', 'sender_account_id', 'receiver_account_id', 'amount', 'timestamp', 'transaction_type', 'status'];
  const rows = [
    ['TXN-DEMO-001', 'ACC-100010', 'ACC-100025', '450.00', '2026-11-15T09:30:00Z', 'ACH', 'COMPLETED'],
    ['TXN-DEMO-002', 'ACC-100025', 'ACC-100088', '1250.50', '2026-11-15T11:45:00Z', 'WIRE', 'COMPLETED'],
    ['TXN-DEMO-003', 'ACC-100088', 'ACC-100142', '89.99', '2026-11-15T14:10:00Z', 'P2P', 'COMPLETED'],
    ['TXN-DEMO-004', 'ACC-100142', 'ACC-100010', '3200.00', '2026-11-15T16:20:00Z', 'INTERNAL', 'COMPLETED'],
    ['TXN-DEMO-005', 'ACC-100201', 'ACC-100202', '9500.00', '2026-11-16T08:05:00Z', 'WIRE', 'COMPLETED'],
    ['TXN-DEMO-006', 'ACC-100203', 'ACC-100202', '9800.00', '2026-11-16T08:25:00Z', 'WIRE', 'COMPLETED'],
    ['TXN-DEMO-007', 'ACC-100204', 'ACC-100202', '9650.00', '2026-11-16T08:50:00Z', 'ACH', 'COMPLETED'],
    ['TXN-DEMO-008', 'ACC-100202', 'ACC-100310', '28500.00', '2026-11-16T10:15:00Z', 'SWIFT', 'COMPLETED'],
  ];

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Export runner
export function exportDatasetFiles(targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const dataset = generateFullDataset();

  // 1. Write accounts.csv
  const accountsCsv = accountsToCsv(dataset.accounts);
  fs.writeFileSync(path.join(targetDir, 'accounts.csv'), accountsCsv, 'utf-8');
  console.log(`Saved ${path.join(targetDir, 'accounts.csv')} (${dataset.accounts.length} rows)`);

  // 2. Write transactions.csv
  const transactionsCsv = transactionsToCsv(dataset.transactions);
  fs.writeFileSync(path.join(targetDir, 'transactions.csv'), transactionsCsv, 'utf-8');
  console.log(`Saved ${path.join(targetDir, 'transactions.csv')} (${dataset.transactions.length} rows)`);

  // 3. Write ground_truth.json
  fs.writeFileSync(
    path.join(targetDir, 'ground_truth.json'),
    JSON.stringify(dataset.groundTruth, null, 2),
    'utf-8'
  );
  console.log(`Saved ${path.join(targetDir, 'ground_truth.json')}`);

  // 4. Write default_dataset.json (self-contained)
  fs.writeFileSync(
    path.join(targetDir, 'default_dataset.json'),
    JSON.stringify(dataset, null, 2),
    'utf-8'
  );
  console.log(`Saved ${path.join(targetDir, 'default_dataset.json')}`);

  // 5. Write template_transactions.csv
  fs.writeFileSync(
    path.join(targetDir, 'template_transactions.csv'),
    createTemplateCsv(),
    'utf-8'
  );
  console.log(`Saved ${path.join(targetDir, 'template_transactions.csv')}`);
}

// Direct execution entrypoint
const isMain = Boolean(
  process.argv[1] &&
  (process.argv[1] === __filename || process.argv[1].endsWith('generate_dataset.ts'))
);

if (isMain) {
  console.log(`Executing dataset generation into ${__dirname}...`);
  exportDatasetFiles(__dirname);
  console.log('Dataset generation completed successfully!');
}
