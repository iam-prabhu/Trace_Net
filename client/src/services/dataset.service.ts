import { apiClient } from './api';
import { ApiResponse } from '../types/index';

export async function listDatasets(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>('/datasets');
  return res.data.data ?? [];
}

export async function uploadDataset(file: File): Promise<unknown> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<ApiResponse<unknown>>('/datasets/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function processDataset(id: string): Promise<unknown> {
  const res = await apiClient.post<ApiResponse<unknown>>(`/datasets/${id}/process`);
  return res.data.data;
}
