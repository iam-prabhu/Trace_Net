import { DatasetImport } from '../types/investigation.types';
import { inMemoryStore } from './in-memory.store';
import { Transaction, Account } from '../types/graph.types';

export interface CsvImportRow {
  transaction_id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: number | string;
  timestamp: string;
  transaction_type?: string;
}

export interface ImportResult {
  importId: string;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  newAccountsCount: number;
  newTransactionsCount: number;
  errors: Array<{ row: number; error: string; data?: unknown }>;
}

export class DatasetRepository {
  async listDatasets(): Promise<DatasetImport[]> {
    const list = Array.from(inMemoryStore.datasets.values());
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }

  async getDatasetById(id: string): Promise<DatasetImport | null> {
    return inMemoryStore.datasets.get(id) || null;
  }

  async createDatasetRecord(record: DatasetImport): Promise<DatasetImport> {
    inMemoryStore.datasets.set(record.id, record);
    return record;
  }

  async deleteDataset(id: string): Promise<boolean> {
    return inMemoryStore.datasets.delete(id);
  }

  public importTransactions(
    rows: any[],
    uploadedBy: string,
    fileName: string = 'batch_import.csv'
  ): ImportResult {
    const importId = `ds-imp-${Date.now()}`;
    const errors: Array<{ row: number; error: string; data?: unknown }> = [];
    const validTransactions: Transaction[] = [];
    const newAccounts = new Set<string>();
    const seenBatchTxnIds = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Validate required columns
      const txnId = (row.transaction_id || row.transactionId || '').trim();
      const senderId = (row.sender_account_id || row.senderAccountId || '').trim();
      const receiverId = (row.receiver_account_id || row.receiverAccountId || '').trim();
      const rawAmount = row.amount;
      const rawTimestamp = row.timestamp;

      if (!txnId) {
        errors.push({ row: rowNum, error: 'Missing or empty transaction_id' });
        continue;
      }

      if (seenBatchTxnIds.has(txnId)) {
        errors.push({ row: rowNum, error: `Duplicate transaction_id in batch: ${txnId}` });
        continue;
      }
      seenBatchTxnIds.add(txnId);

      if (!senderId) {
        errors.push({ row: rowNum, error: 'Missing sender_account_id' });
        continue;
      }

      if (!receiverId) {
        errors.push({ row: rowNum, error: 'Missing receiver_account_id' });
        continue;
      }

      if (senderId === receiverId) {
        errors.push({ row: rowNum, error: 'Self-transactions (sender equals receiver) are invalid' });
        continue;
      }

      const amount = parseFloat(rawAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.push({
          row: rowNum,
          error: `Invalid positive float amount: ${rawAmount}`,
        });
        continue;
      }

      const parsedDate = new Date(rawTimestamp);
      if (isNaN(parsedDate.getTime())) {
        errors.push({
          row: rowNum,
          error: `Invalid ISO timestamp: ${rawTimestamp}`,
        });
        continue;
      }

      const txn: Transaction = {
        id: txnId,
        transactionId: txnId,
        senderAccountId: senderId,
        receiverAccountId: receiverId,
        amount: Math.round(amount * 100) / 100,
        timestamp: parsedDate.toISOString(),
        transactionType: row.transaction_type || row.transactionType || 'WIRE',
        status: 'COMPLETED',
        isSuspicious: amount >= 100000,
      };

      validTransactions.push(txn);

      if (!inMemoryStore.accounts.has(senderId)) {
        newAccounts.add(senderId);
      }
      if (!inMemoryStore.accounts.has(receiverId)) {
        newAccounts.add(receiverId);
      }
    }

    // Auto-create missing accounts
    for (const accId of newAccounts) {
      const newAcc: Account = {
        id: accId,
        accountId: accId,
        accountType: 'CHECKING',
        riskScore: 20,
        status: 'ACTIVE',
        balance: 10000,
        ownerName: `Account ${accId}`,
        country: 'US',
        createdAt: new Date().toISOString(),
      };
      inMemoryStore.accounts.set(accId, newAcc);
    }

    // Insert valid transactions
    for (const txn of validTransactions) {
      inMemoryStore.transactions.set(txn.transactionId, txn);
      inMemoryStore.addEdgeToIndices(txn);
    }

    // Create DatasetImport record
    const dsRecord: DatasetImport = {
      id: importId,
      name: `Import: ${fileName}`,
      description: `Imported ${validTransactions.length} records. ${errors.length} failed.`,
      filePath: fileName,
      status: errors.length === 0 ? 'COMPLETED' : validTransactions.length > 0 ? 'PARTIAL' : 'FAILED',
      recordCount: rows.length,
      nodeCount: newAccounts.size,
      edgeCount: validTransactions.length,
      errors: errors.map(e => `Row ${e.row}: ${e.error}`),
      uploadedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.datasets.set(importId, dsRecord);

    return {
      importId,
      totalRecords: rows.length,
      successCount: validTransactions.length,
      failureCount: errors.length,
      newAccountsCount: newAccounts.size,
      newTransactionsCount: validTransactions.length,
      errors,
    };
  }
}

export const datasetRepository = new DatasetRepository();
