// Generic API response wrapper
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

// Pagination
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasMore: boolean;
    };
}

// Error handling
export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, string[]>;
}

// File upload
export interface UploadResponse {
    url: string;
    fileName: string;
    fileSize: number;
}