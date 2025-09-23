'use client';

import React from 'react';
import { ERROR_CODES } from '@/lib/config/api';
import { AppError, useError } from '@/lib/error/errorContext';

// Enhanced error display component using CSS variables
export const UserFriendlyError: React.FC<{ 
  error: AppError; 
  onDismiss?: () => void;
  variant?: 'toast' | 'inline' | 'modal';
}> = ({ error, onDismiss, variant = 'toast' }) => {
  
  const getErrorConfig = (code: string) => {
    switch (code) {
      case ERROR_CODES.UNAUTHORIZED:
        return {
          icon: '🔐',
          title: 'Authentication Required',
          message: 'Please log in to continue using this feature.',
          action: 'Log In',
          severity: 'warning' as const,
        };
      case ERROR_CODES.INVALID_CREDENTIALS:
        return {
          icon: '❌',
          title: 'Login Failed',
          message: 'The username or password you entered is incorrect.',
          action: 'Try Again',
          severity: 'error' as const,
        };
      case ERROR_CODES.TOKEN_EXPIRED:
        return {
          icon: '⏰',
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          action: 'Log In',
          severity: 'warning' as const,
        };
      case ERROR_CODES.VALIDATION_ERROR:
        return {
          icon: '⚠️',
          title: 'Invalid Input',
          message: 'Please check your input and try again.',
          action: 'Fix Input',
          severity: 'warning' as const,
        };
      case ERROR_CODES.REQUIRED_FIELD:
        return {
          icon: '📝',
          title: 'Missing Information',
          message: 'Please fill in all required fields.',
          action: 'Complete Form',
          severity: 'warning' as const,
        };
      case ERROR_CODES.FILE_TOO_LARGE:
        return {
          icon: '📁',
          title: 'File Too Large',
          message: 'The file you selected is too large. Maximum size is 10MB.',
          action: 'Choose Smaller File',
          severity: 'warning' as const,
        };
      case ERROR_CODES.INVALID_FILE_TYPE:
        return {
          icon: '📄',
          title: 'Invalid File Type',
          message: 'Please select a valid image or video file.',
          action: 'Choose Valid File',
          severity: 'warning' as const,
        };
      case ERROR_CODES.DUPLICATE_ENTRY:
        return {
          icon: '🔄',
          title: 'Already Exists',
          message: 'This item already exists. Please try something different.',
          action: 'Try Different',
          severity: 'info' as const,
        };
      case ERROR_CODES.NOT_FOUND:
        return {
          icon: '🔍',
          title: 'Not Found',
          message: 'The item you\'re looking for doesn\'t exist.',
          action: 'Go Back',
          severity: 'info' as const,
        };
      case ERROR_CODES.PERMISSION_DENIED:
        return {
          icon: '🚫',
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          action: 'Contact Admin',
          severity: 'error' as const,
        };
      case ERROR_CODES.RATE_LIMITED:
        return {
          icon: '⏳',
          title: 'Too Many Requests',
          message: 'Please wait a moment before trying again.',
          action: 'Wait & Retry',
          severity: 'warning' as const,
        };
      case ERROR_CODES.NETWORK_ERROR:
        return {
          icon: '🌐',
          title: 'Connection Problem',
          message: 'Please check your internet connection and try again.',
          action: 'Retry',
          severity: 'error' as const,
        };
      case ERROR_CODES.TIMEOUT:
        return {
          icon: '⏱️',
          title: 'Request Timeout',
          message: 'The request took too long. Please try again.',
          action: 'Retry',
          severity: 'warning' as const,
        };
      default:
        return {
          icon: '❓',
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again.',
          action: 'Try Again',
          severity: 'error' as const,
        };
    }
  };

  const config = getErrorConfig(error.code);
  
  const getSeverityStyles = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const styles = getSeverityStyles(config.severity);

  if (variant === 'inline') {
    return (
      <div className={`border rounded-lg p-4 ${styles.container}`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 mr-3 text-xl ${styles.icon}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">
              {config.title}
            </h3>
            <p className="mt-1 text-sm">
              {config.message}
            </p>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`mt-2 px-3 py-1 text-xs rounded-md ${styles.button} transition-colors`}
              >
                {config.action}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 ${styles.container}`}>
          <div className="text-center">
            <div className={`text-4xl mb-4 ${styles.icon}`}>
              {config.icon}
            </div>
            <h2 className="text-lg font-semibold mb-2">
              {config.title}
            </h2>
            <p className="text-sm mb-4">
              {config.message}
            </p>
            <div className="flex gap-2 justify-center">
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`px-4 py-2 text-sm rounded-md ${styles.button} transition-colors`}
                >
                  {config.action}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default toast variant
  return (
    <div className={`border rounded-lg p-4 shadow-lg ${styles.container} animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 mr-3 text-xl ${styles.icon}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">
            {config.title}
          </h3>
          <p className="mt-1 text-sm">
            {config.message}
          </p>
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

// Error toast container
export const ErrorToastContainer: React.FC = () => {
  const { errors, removeError } = useError();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map((error) => (
        <UserFriendlyError
          key={error.id}
          error={error}
          variant="toast"
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </div>
  );
};

// Form error display
export const FormError: React.FC<{ 
  error?: AppError; 
  field?: string;
}> = ({ error, field }) => {
  if (!error) return null;

  return (
    <div className="mt-1 text-sm text-red-600 flex items-center">
      <span className="mr-1">⚠️</span>
      <span>{error.message}</span>
    </div>
  );
};

// Loading error display
export const LoadingError: React.FC<{ 
  error?: AppError; 
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">😞</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Failed to Load
      </h3>
      <p className="text-gray-600 mb-4">
        {error.message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
