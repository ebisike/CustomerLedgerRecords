import apiClient from './axios';
import type {
  ApiResponse,
  AuthResult,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  InviteUserDto,
  AcceptInvitationDto,
} from '@/types';

export const authApi = {
  login: (dto: LoginDto) =>
    apiClient.post<ApiResponse<AuthResult>>('/auth/login', dto),

  forgotPassword: (dto: ForgotPasswordDto) =>
    apiClient.post<ApiResponse<string>>('/auth/forgot-password', dto),

  resetPassword: (dto: ResetPasswordDto) =>
    apiClient.post<ApiResponse<string>>('/auth/reset-password', dto),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthResult>>('/auth/refresh-token', { refreshToken }),

  inviteUser: (dto: InviteUserDto) =>
    apiClient.post<ApiResponse<string>>('/auth/invite', dto),

  acceptInvitation: (dto: AcceptInvitationDto) =>
    apiClient.post<ApiResponse<AuthResult>>('/auth/accept-invitation', dto),
};
