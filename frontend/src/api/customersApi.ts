import apiClient from './axios';
import type {
  ApiResponse,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFilters,
} from '@/types';

export const customersApi = {
  getAll: (filters: CustomerFilters = {}) =>
    apiClient.get<ApiResponse<Customer[]>>('/customers', { params: filters }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Customer>>(`/customers/${id}`),

  create: (dto: CreateCustomerDto) =>
    apiClient.post<ApiResponse<Customer>>('/customers', dto),

  update: (id: string, dto: UpdateCustomerDto) =>
    apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, dto),
};
