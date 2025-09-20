'use client';

import React from 'react';

interface ModernSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const ModernSection: React.FC<ModernSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-card-foreground">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};
