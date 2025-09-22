'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export const ModernCheckbox: React.FC<ModernCheckboxProps> = ({
  label,
  description,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
      <input
        type="checkbox"
        className={cn('rounded border-border', className)}
        {...props}
      />
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-card-foreground">
          {label}
        </span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground ml-2">
          {description}
        </p>
      )}
    </div>
  );
};
