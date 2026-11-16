import {
  accountRepository,
  AccountListQuery,
  AccountDetailResult,
} from '../repositories/account.repository';
import { Account, Transaction, GraphData } from '../types/graph.types';

export async function getAccounts(
  query: AccountListQuery
): Promise<{ accounts: Account[]; total: number; page: number; pageSize: number }> {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const res = await accountRepository.getAccounts({
    ...query,
    page,
    pageSize,
  });
  return {
    accounts: res.accounts,
    total: res.total,
    page,
    pageSize,
  };
}

export async function getAccountById(
  accountId: string
): Promise<AccountDetailResult | null> {
  return accountRepository.getAccountById(accountId);
}

export async function getAccountTransactions(
  accountId: string,
  direction?: 'INCOMING' | 'OUTGOING' | 'BOTH',
  page: number = 1,
  pageSize: number = 20,
  startDate?: string,
  endDate?: string
): Promise<{ transactions: Transaction[]; total: number }> {
  return accountRepository.getAccountTransactions(
    accountId,
    direction,
    page,
    pageSize,
    startDate,
    endDate
  );
}

export async function getAccountNeighbors(
  accountId: string,
  depth: number = 1
): Promise<GraphData> {
  return accountRepository.getNeighbors(accountId, depth);
}

export async function createAccount(data: Partial<Account>): Promise<Account> {
  return accountRepository.createAccount(data);
}

export async function updateAccount(
  accountId: string,
  data: Partial<Account>
): Promise<Account | null> {
  return accountRepository.updateAccount(accountId, data);
}
