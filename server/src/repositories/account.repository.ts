import { Account, Transaction, GraphData } from '../types/graph.types';
import { isNeo4jAvailable } from '../config/neo4j';
import { neo4jRepository } from './neo4j.repository';
import { inMemoryStore } from './in-memory.store';

export interface AccountListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  accountType?: string;
  status?: string;
  isFlagged?: boolean;
  minRisk?: number;
  maxRisk?: number;
  sortBy?: 'riskScore' | 'balance' | 'createdAt' | 'accountId';
  sortOrder?: 'asc' | 'desc';
}

export interface AccountDetailResult {
  account: Account;
  metrics: {
    incomingCount: number;
    incomingVolume: number;
    outgoingCount: number;
    outgoingVolume: number;
    totalTransactions: number;
    netVolume: number;
    directNeighborsCount: number;
  };
}

export class AccountRepository {
  async getAccounts(query: AccountListQuery): Promise<{ accounts: Account[]; total: number }> {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));

    if (isNeo4jAvailable()) {
      try {
        const whereClauses: string[] = [];
        const params: Record<string, unknown> = {};

        if (query.search) {
          whereClauses.push('(a.accountId CONTAINS $search OR a.ownerName CONTAINS $search)');
          params.search = query.search;
        }
        if (query.accountType && query.accountType !== 'ALL') {
          whereClauses.push('a.accountType = $accountType');
          params.accountType = query.accountType;
        }
        if (query.status && query.status !== 'ALL') {
          whereClauses.push('a.status = $status');
          params.status = query.status;
        }
        if (query.isFlagged !== undefined) {
          whereClauses.push('a.isFlagged = $isFlagged');
          params.isFlagged = query.isFlagged;
        }
        if (query.minRisk !== undefined) {
          whereClauses.push('a.riskScore >= $minRisk');
          params.minRisk = query.minRisk;
        }

        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const countRes = await neo4jRepository.query<{ total: number }>(
          `MATCH (a:Account) ${whereStr} RETURN count(a) as total`,
          params
        );
        const total = countRes[0]?.total || 0;

        const skip = (page - 1) * pageSize;
        const records = await neo4jRepository.query<{ a: any }>(
          `MATCH (a:Account) ${whereStr}
           RETURN a SKIP ${skip} LIMIT ${pageSize}`,
          params
        );

        if (records.length > 0) {
          return {
            accounts: records.map(r => r.a.properties as Account),
            total,
          };
        }
      } catch (err) {
        console.warn('Neo4j getAccounts failed, using in-memory store:', err);
      }
    }

    // In-Memory store filtering
    let list = Array.from(inMemoryStore.accounts.values());

    if (query.search) {
      const s = query.search.toLowerCase();
      list = list.filter(
        a => a.accountId.toLowerCase().includes(s) || a.ownerName.toLowerCase().includes(s)
      );
    }

    if (query.accountType && query.accountType !== 'ALL') {
      list = list.filter(a => a.accountType.toUpperCase() === query.accountType!.toUpperCase());
    }

    if (query.status && query.status !== 'ALL') {
      list = list.filter(a => a.status.toUpperCase() === query.status!.toUpperCase());
    }

    if (query.isFlagged !== undefined) {
      list = list.filter(a => Boolean(a.isFlagged) === query.isFlagged);
    }

    if (query.minRisk !== undefined) {
      list = list.filter(a => a.riskScore >= query.minRisk!);
    }

    if (query.maxRisk !== undefined) {
      list = list.filter(a => a.riskScore <= query.maxRisk!);
    }

    // Sorting
    const sortBy = query.sortBy || 'riskScore';
    const sortOrder = query.sortOrder || 'desc';
    list.sort((a: any, b: any) => {
      let va = a[sortBy] ?? 0;
      let vb = b[sortBy] ?? 0;
      if (typeof va === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortOrder === 'asc' ? va - vb : vb - va;
    });

    const total = list.length;
    const skip = (page - 1) * pageSize;
    const paginated = list.slice(skip, skip + pageSize);

    return { accounts: paginated, total };
  }

  async getAccountById(accountId: string): Promise<AccountDetailResult | null> {
    const acc = inMemoryStore.accounts.get(accountId);
    if (!acc) return null;

    const outTxns = inMemoryStore.outgoingEdges.get(accountId) || [];
    const inTxns = inMemoryStore.incomingEdges.get(accountId) || [];

    let incomingVolume = 0;
    for (const t of inTxns) incomingVolume += t.amount;

    let outgoingVolume = 0;
    for (const t of outTxns) outgoingVolume += t.amount;

    const neighbors = new Set<string>();
    for (const t of outTxns) neighbors.add(t.receiverAccountId);
    for (const t of inTxns) neighbors.add(t.senderAccountId);

    return {
      account: acc,
      metrics: {
        incomingCount: inTxns.length,
        incomingVolume: Math.round(incomingVolume * 100) / 100,
        outgoingCount: outTxns.length,
        outgoingVolume: Math.round(outgoingVolume * 100) / 100,
        totalTransactions: inTxns.length + outTxns.length,
        netVolume: Math.round((incomingVolume - outgoingVolume) * 100) / 100,
        directNeighborsCount: neighbors.size,
      },
    };
  }

  async getAccountTransactions(
    accountId: string,
    direction: 'INCOMING' | 'OUTGOING' | 'BOTH' = 'BOTH',
    page: number = 1,
    pageSize: number = 20,
    startDate?: string,
    endDate?: string
  ): Promise<{ transactions: Transaction[]; total: number }> {
    let list: Transaction[] = [];

    if (direction === 'OUTGOING' || direction === 'BOTH') {
      list.push(...(inMemoryStore.outgoingEdges.get(accountId) || []));
    }
    if (direction === 'INCOMING' || direction === 'BOTH') {
      list.push(...(inMemoryStore.incomingEdges.get(accountId) || []));
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      list = list.filter(t => new Date(t.timestamp).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      list = list.filter(t => new Date(t.timestamp).getTime() <= end);
    }

    // Sort by timestamp descending
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = list.length;
    const skip = (page - 1) * pageSize;
    const paginated = list.slice(skip, skip + pageSize);

    return { transactions: paginated, total };
  }

  async getNeighbors(accountId: string, depth: number = 1): Promise<GraphData> {
    return inMemoryStore.getNeighbors(accountId, depth);
  }

  async createAccount(acc: Partial<Account>): Promise<Account> {
    const accountId = acc.accountId || acc.id || `ACC-${Date.now()}`;
    const newAcc: Account = {
      id: accountId,
      accountId,
      accountType: acc.accountType || 'CHECKING',
      riskScore: acc.riskScore ?? 0,
      status: acc.status || 'ACTIVE',
      balance: acc.balance ?? 0,
      ownerName: acc.ownerName || `Account ${accountId}`,
      country: acc.country || 'US',
      createdAt: acc.createdAt || new Date().toISOString(),
      isFlagged: acc.isFlagged ?? (acc.riskScore ? acc.riskScore > 75 : false),
    };

    inMemoryStore.accounts.set(accountId, newAcc);
    return newAcc;
  }

  async updateAccount(accountId: string, partial: Partial<Account>): Promise<Account | null> {
    const acc = inMemoryStore.accounts.get(accountId);
    if (!acc) return null;

    const updated: Account = {
      ...acc,
      ...partial,
      accountId: acc.accountId, // protect ID
      id: acc.id,
    };

    if (partial.isFlagged !== undefined) {
      updated.isFlagged = partial.isFlagged;
    } else if (partial.status === 'FLAGGED' || (partial.riskScore && partial.riskScore > 75)) {
      updated.isFlagged = true;
    } else if (partial.status === 'ACTIVE' || partial.status === 'CLEARED') {
      updated.isFlagged = false;
    }

    inMemoryStore.accounts.set(accountId, updated);
    return updated;
  }
}

export const accountRepository = new AccountRepository();
