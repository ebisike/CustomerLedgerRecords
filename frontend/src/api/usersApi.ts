import apiClient from './axios';
import type { ApiResponse, User } from '@/types';

export const usersApi = {
  getAll: (params: { pageIndex?: number; pageSize?: number; search?: string } = {}) =>
    apiClient.get<ApiResponse<User[]>>('/users', { params }),
};
