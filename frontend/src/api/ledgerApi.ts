import apiClient from './axios';
import type {
  ApiResponse,
  LedgerEntry,
  AddLedgerEntryDto,
  LedgerFilters,
  ExportLedgerParams,
} from '@/types';

export const ledgerApi = {
  getEntries: (customerId: string, filters: LedgerFilters = {}) =>
    apiClient.get<ApiResponse<LedgerEntry[]>>(`/ledger/customers/${customerId}/entries`, {
      params: filters,
    }),

  addEntry: (customerId: string, dto: AddLedgerEntryDto) =>
    apiClient.post<ApiResponse<LedgerEntry>>(`/ledger/customers/${customerId}/entries`, dto),

  exportLedger: (customerId: string, params: ExportLedgerParams) =>
    apiClient.get(`/ledger/customers/${customerId}/export`, {
      params,
      responseType: 'blob',
    }),
};
