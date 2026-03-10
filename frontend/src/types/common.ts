export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
