
export interface User {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phoneNumber: string;
  stationId?: string;
  role: 'passenger' | 'driver' | 'station_admin' | 'super_admin' | string;
  isActive: boolean;
  profileImage?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone: string;
  emergencyContact?: string;
  termsAccepted: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  emergencyContact?: string;
  termsAccepted: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface UpdateProfileFormData {
  name?: string;
  phone?: string;
  emergencyContact?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}
export interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  emergencyContact?: string;
}

export interface LoginValidationErrors {
  email?: string;
  password?: string;
}

export interface ZodError {
  field: string;
  message: string;
}

export interface LoginData {
  email: string;
  password: string;
}
export interface RegisterApiRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role?: 'passenger';
  emergencyContact?: string;
}

export interface RegisterBackendData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role?: string;
  emergencyContact?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface AuthResponse extends ApiResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  message: string;
  token?: string;
  expiresIn?: number;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface ForgotPasswordResponse extends ApiResponse {
  resetToken?: string;
  expiresAt?: string;
}

export interface LogoutResponse extends ApiResponse {
  timestamp: string;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastLogin: string | null;
}

export interface AuthMutationResult {
  success: boolean;
  message: string;
  error?: string;
  user?: User;
  token?: string;
}

export type UserRole = 'passenger';

export interface TokenData {
  token: string;
  expiresAt: Date;
  userId: string;
  role: UserRole;
}

export interface JWTDecoded {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface SessionData {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  deviceInfo?: {
    platform: string;
    osVersion: string;
    deviceModel: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  register: (data: RegisterFormData) => Promise<AuthMutationResult>;
  login: (credentials: LoginCredentials) => Promise<AuthMutationResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<ApiResponse>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;

  isRegistering: boolean;
  isLoggingIn: boolean;
  isForgotPassword: boolean;
}