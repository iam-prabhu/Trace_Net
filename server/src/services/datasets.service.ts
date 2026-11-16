import fs from 'fs';
import {
  datasetRepository,
  ImportResult,
} from '../repositories/dataset.repository';
import { DatasetImport } from '../types/investigation.types';

export function parseCsvString(csvContent: string): any[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const rowObj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = values[j] !== undefined ? values[j] : '';
    }
    rows.push(rowObj);
  }

  return rows;
}

export async function listDatasets(): Promise<DatasetImport[]> {
  return datasetRepository.listDatasets();
}

export async function getDatasetById(id: string): Promise<DatasetImport | null> {
  return datasetRepository.getDatasetById(id);
}

export async function importDataset(options: {
  file?: Express.Multer.File;
  csvString?: string;
  transactions?: any[];
  fileName?: string;
  uploadedBy?: string;
}): Promise<ImportResult> {
  let rows: any[] = [];
  let fileName = options.fileName || 'imported_dataset.csv';

  if (options.file) {
    fileName = options.file.originalname || fileName;
    const content = fs.existsSync(options.file.path)
      ? fs.readFileSync(options.file.path, 'utf-8')
      : options.file.buffer
      ? options.file.buffer.toString('utf-8')
      : '';
    rows = parseCsvString(content);

    // Clean up temp file if exists
    if (fs.existsSync(options.file.path)) {
      try {
        fs.unlinkSync(options.file.path);
      } catch {
        // ignore
      }
    }
  } else if (options.csvString) {
    rows = parseCsvString(options.csvString);
  } else if (Array.isArray(options.transactions)) {
    rows = options.transactions;
  } else {
    throw new Error('No CSV file, string, or transaction array provided');
  }

  const uploader = options.uploadedBy || 'Investigator';
  return datasetRepository.importTransactions(rows, uploader, fileName);
}

export async function processDataset(id: string): Promise<DatasetImport | null> {
  const ds = await datasetRepository.getDatasetById(id);
  if (!ds) return null;
  ds.status = 'READY';
  ds.updatedAt = new Date();
  return ds;
}

export async function deleteDataset(id: string): Promise<boolean> {
  return datasetRepository.deleteDataset(id);
}
