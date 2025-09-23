/**
 * Centralized API Configuration
 * Single source of truth for all API-related settings
 */

// API Configuration
export const API_CONFIG = {
  // Base URLs with fallbacks
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 
           process.env.NEXT_PUBLIC_API_URL || 
           'http://localhost:8080',
  
  // WebSocket URL
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 
         'ws://localhost:8080/ws',
  
  // Request settings
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  
  // File upload settings
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  
  // Pagination settings
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Cache settings
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/login',
    register: '/api/register',
    logout: '/api/logout',
    refresh: '/api/refresh',
  },
  
  // User management
  user: {
    profile: '/api/profile',
    updateProfile: '/api/profile/update',
    uploadAvatar: '/api/upload/avatar',
    follow: '/api/follow',
    unfollow: '/api/unfollow',
    followers: '/api/followers',
    following: '/api/following',
  },
  
  // Posts
  posts: {
    create: '/api/post',
    get: '/api/post',
    update: '/api/post/update',
    delete: '/api/post/delete',
    like: '/api/post/like',
    unlike: '/api/post/unlike',
    comment: '/api/comment',
    getComments: '/api/comment',
  },
  
  // Groups
  groups: {
    create: '/api/group',
    get: '/api/group',
    update: '/api/group/update',
    delete: '/api/group/delete',
    join: '/api/group/join',
    leave: '/api/group/leave',
    invite: '/api/group/invite',
    members: '/api/group/members',
  },
  
  // Chat
  chat: {
    conversations: '/api/chat/conversations',
    messages: '/api/chat/messages',
    send: '/api/chat/send',
    groupMessages: '/api/chat/group/messages',
  },
  
  // Notifications
  notifications: {
    get: '/api/notifications',
    markRead: '/api/notifications/read',
    markAllRead: '/api/notifications/read-all',
  },
  
  // File uploads
  upload: {
    image: '/api/upload/image',
    video: '/api/upload/video',
    document: '/api/upload/document',
  },
  
  // Health check
  health: '/api/health',
} as const;

// Error codes mapping
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Business logic errors
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid username or password',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Your account has been temporarily locked',
  
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.REQUIRED_FIELD]: 'This field is required',
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid format. Please check your input',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File is too large. Maximum size is 10MB',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type. Please select a valid image or video',
  
  [ERROR_CODES.DUPLICATE_ENTRY]: 'This item already exists',
  [ERROR_CODES.NOT_FOUND]: 'The requested item was not found',
  [ERROR_CODES.PERMISSION_DENIED]: 'You do not have permission to perform this action',
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again',
  
  [ERROR_CODES.INTERNAL_ERROR]: 'Something went wrong. Please try again later',
  [ERROR_CODES.DATABASE_ERROR]: 'Database error. Please try again later',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again',
} as const;

// Utility functions
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

export const getWsUrl = (): string => {
  return API_CONFIG.wsUrl;
};

export const isRetryableError = (error: Error): boolean => {
  const retryablePatterns = [
    'network error',
    'timeout',
    'connection refused',
    'connection reset',
    'temporary failure',
  ];
  
  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.code && ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]) {
    return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES];
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR];
};

export const getErrorCode = (error: any): string => {
  if (error?.code) {
    return error.code;
  }
  
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes('unauthorized')) return ERROR_CODES.UNAUTHORIZED;
    if (message.includes('not found')) return ERROR_CODES.NOT_FOUND;
    if (message.includes('permission denied')) return ERROR_CODES.PERMISSION_DENIED;
    if (message.includes('timeout')) return ERROR_CODES.TIMEOUT;
    if (message.includes('network')) return ERROR_CODES.NETWORK_ERROR;
  }
  
  return ERROR_CODES.INTERNAL_ERROR;
};

// Request configuration helpers
export const getRequestConfig = (options: {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
} = {}) => {
  return {
    timeout: options.timeout || API_CONFIG.timeout,
    retries: options.retries || API_CONFIG.retries,
    retryDelay: options.retryDelay || API_CONFIG.retryDelay,
  };
};

// File validation helpers
export const validateFileSize = (file: File): boolean => {
  return file.size <= API_CONFIG.maxFileSize;
};

export const validateImageType = (file: File): boolean => {
  return API_CONFIG.allowedImageTypes.includes(file.type as any);
};

export const validateVideoType = (file: File): boolean => {
  return API_CONFIG.allowedVideoTypes.includes(file.type as any);
};

export const getMaxFileSizeMB = (): number => {
  return API_CONFIG.maxFileSize / (1024 * 1024);
};

// Environment helpers
export const isDevelopment = (): boolean => {
  return API_CONFIG.isDevelopment;
};

export const isProduction = (): boolean => {
  return API_CONFIG.isProduction;
};

export const getEnvironment = (): string => {
  return API_CONFIG.environment;
};
