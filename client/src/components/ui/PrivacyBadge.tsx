'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface PrivacyBadgeProps {
  isPrivate: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable privacy badge component matching the profile page design
 */
export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  isPrivate,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (isPrivate) {
    return (
      <div className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-orange-100 rounded-full ${className}`}>
        <Lock className={`${iconSizes[size]} text-orange-600`} />
        <span className="text-orange-600 font-medium">Private</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-green-100 rounded-full ${className}`}>
      <Unlock className={`${iconSizes[size]} text-green-600`} />
      <span className="text-green-600 font-medium">Public</span>
    </div>
  );
};

export default PrivacyBadge;
