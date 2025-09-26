'use client';

import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-4xl'
};

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  fallback, 
  size = 'xl',
  className = '' 
}) => {
  const sizeClass = sizeClasses[size];
  
  // Handle blob URLs (from file preview) and regular URLs differently
  const imageUrl = src && (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('data:')) 
    ? src 
    : src 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${src}`
      : null;
  
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt || 'Avatar'}
          className="w-full h-full rounded-full object-cover border border-border"
        />
      ) : (
        <span className="text-primary-foreground bg-primary/80 rounded-full w-full h-full flex items-center justify-center">
          {fallback}
        </span>
      )}
    </div>
  );
};
