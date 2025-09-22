'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  const baseClasses = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';
  const finalClasses = cn(baseClasses, className);

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        className={finalClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
