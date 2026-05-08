// API Response types
export interface MetaData {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  showing: string;
}

export interface ApiResponse<T> {
  results: T | null;
  status: boolean;
  errorMessage: string;
  successMessage: string;
  metaData: MetaData | null;
  statusCode: number;
}

// Auth types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  companyId: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface InviteUserDto {
  email: string;
  firstName: string;
  lastName: string;
}

export interface AcceptInvitationDto {
  token: string;
  password: string;
  confirmPassword: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  createdAt: string;
  currentBalance: number;
}

export interface CreateCustomerDto {
  name: string;
  address: string;
  phone: string;
  email?: string;
}

export interface UpdateCustomerDto {
  name: string;
  address: string;
  phone: string;
  email?: string;
}

export interface CustomerFilters {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  phone?: string;
  email?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

// Ledger types
export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  invoiceReceiptNumber: string;
  pageNo?: string;
  updatedByName: string;
  updatedById: string;
  debit: number;
  credit: number;
  balance: number;
  createdAt: string;
}

export interface AddLedgerEntryDto {
  date: string;
  description: string;
  invoiceReceiptNumber: string;
  pageNo?: string;
  debit: number;
  credit: number;
}

export interface LedgerFilters {
  pageIndex?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  invoiceReceiptNumber?: string;
  updatedById?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface ExportLedgerParams {
  format: 'pdf' | 'excel';
  startDate?: string;
  endDate?: string;
  invoiceReceiptNumber?: string;
  updatedById?: string;
}
