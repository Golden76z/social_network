'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ERROR_CODES, ERROR_MESSAGES, getErrorCode, getErrorMessage } from '@/lib/config/api';

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  id: string;
}

export interface ErrorContextType {
  errors: AppError[];
  addError: (error: any) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  hasErrors: boolean;
}

// Create error context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Error provider component
export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: any) => {
    const errorCode = getErrorCode(error);
    const errorMessage = getErrorMessage(error);
    
    const newError: AppError = {
      code: errorCode,
      message: errorMessage,
      details: error?.details || error?.stack,
      timestamp: new Date(),
      id: Math.random().toString(36).substr(2, 9),
    };

    setErrors(prev => [...prev, newError]);

    // Auto-remove error after 5 seconds for non-critical errors
    if (!isCriticalError(errorCode)) {
      setTimeout(() => {
        setErrors(prev => prev.filter(e => e.id !== newError.id));
      }, 5000);
    }
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;

  return (
    <ErrorContext.Provider value={{
      errors,
      addError,
      removeError,
      clearErrors,
      hasErrors,
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook to use error context
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Helper function to check if error is critical
const isCriticalError = (code: string): boolean => {
  const criticalCodes = [
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.ACCOUNT_LOCKED,
    ERROR_CODES.PERMISSION_DENIED,
  ];
  return criticalCodes.includes(code as any);
};

// Error boundary component
export class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error display component
export const ErrorDisplay: React.FC<{ error: AppError; onDismiss?: () => void }> = ({ 
  error, 
  onDismiss 
}) => {
  const getErrorIcon = (code: string) => {
    switch (code) {
      case ERROR_CODES.UNAUTHORIZED:
      case ERROR_CODES.INVALID_CREDENTIALS:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case ERROR_CODES.VALIDATION_ERROR:
      case ERROR_CODES.REQUIRED_FIELD:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case ERROR_CODES.NETWORK_ERROR:
      case ERROR_CODES.TIMEOUT:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getErrorColor = (code: string) => {
    switch (code) {
      case ERROR_CODES.UNAUTHORIZED:
      case ERROR_CODES.INVALID_CREDENTIALS:
        return 'bg-red-50 border-red-200 text-red-800';
      case ERROR_CODES.VALIDATION_ERROR:
      case ERROR_CODES.REQUIRED_FIELD:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ERROR_CODES.NETWORK_ERROR:
      case ERROR_CODES.TIMEOUT:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getErrorColor(error.code)}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getErrorIcon(error.code)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">
            {error.message}
          </h3>
          {error.details && (
            <p className="mt-1 text-xs opacity-75">
              {error.details}
            </p>
          )}
        </div>
        {onDismiss && (
          <div className="flex-shrink-0 ml-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-current hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Error list component
export const ErrorList: React.FC = () => {
  const { errors, removeError } = useError();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map((error) => (
        <ErrorDisplay
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </div>
  );
};

// Hook for handling API errors
export const useApiError = () => {
  const { addError } = useError();

  const handleError = useCallback((error: any) => {
    console.error('API Error:', error);
    addError(error);
  }, [addError]);

  return { handleError };
};
