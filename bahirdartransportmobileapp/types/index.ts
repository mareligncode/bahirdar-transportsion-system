
export * from './auth';
export * from './trip';
export * from './booking';
export * from './payment';
export * from './notification';
export * from './support';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
}