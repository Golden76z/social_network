'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  onDismiss?: () => void;
  variant?: 'default' | 'warning' | 'critical';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onDismiss,
  variant = 'default',
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
        };
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
          icon: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/40'
        };
      default:
        return {
          container: 'bg-destructive/10 border-destructive/20 text-destructive',
          icon: 'text-destructive',
          iconBg: 'bg-destructive/20'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-3 ${styles.container} ${className}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
        <AlertCircle className={`w-4 h-4 ${styles.icon}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">
          {error}
        </p>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${styles.icon}`}
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Success message component for positive feedback
interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onDismiss,
  className = ''
}) => {
  return (
    <div className={`rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">
          {message}
        </p>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-green-600 dark:text-green-400"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

