// ==================== USER TYPES ====================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Added for compatibility
  phoneNumber: string;
  role: 'passenger'; // Fixed to passenger only
  stationId?: string;
  isActive: boolean;
  profileImage?: string;
  emergencyContact?: string; // Added
  createdAt: string;
  updatedAt: string;
}

// ==================== AUTH CREDENTIAL TYPES ====================
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string; // Backend expects first/last name separately
  phone: string;
  emergencyContact?: string;
  termsAccepted: boolean;
}

// ==================== FORM DATA TYPES ====================
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

// ==================== VALIDATION ERROR TYPES ====================
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

// ==================== API REQUEST TYPES ====================
export interface LoginData {
  email: string;
  password: string;
}

// BahirDarTransportMobileApp\types\auth.ts - Update
export interface RegisterApiRequest {
  email: string;
  password: string;
  fullName: string; // Changed from 'name'
  phoneNumber: string; // Changed from 'phone'
  role?: 'passenger';
  emergencyContact?: string;
}

export interface RegisterBackendData {
  email: string;
  password: string;
  fullName: string; // Changed
  phoneNumber: string; // Changed
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

// ==================== API RESPONSE TYPES ====================
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

// ==================== API ERROR TYPES ====================
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  code?: string;
}

// ==================== PAGINATION TYPES ====================
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

// ==================== STORE/AUTH STATE TYPES ====================
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastLogin: string | null;
}

// ==================== MUTATION RESULT TYPES ====================
export interface AuthMutationResult {
  success: boolean;
  message: string;
  error?: string;
  user?: User;
  token?: string;
}

// ==================== SECURITY TYPES ====================
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

// ==================== SESSION TYPES ====================
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

// ==================== HOOK RETURN TYPES ====================
export interface UseAuthReturn {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  register: (data: RegisterFormData) => Promise<AuthMutationResult>;
  login: (credentials: LoginCredentials) => Promise<AuthMutationResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<ApiResponse>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  
  // Mutation status
  isRegistering: boolean;
  isLoggingIn: boolean;
  isForgotPassword: boolean;
}