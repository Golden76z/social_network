'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

/**
 * Enhanced loading spinner component using global CSS variables
 * Features a larger, more prominent circle animation with brand colors
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Main spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div 
          className={`${sizeClasses[size]} rounded-full border-4 border-transparent animate-spin`}
          style={{
            borderTopColor: 'var(--primary)',
            borderRightColor: 'var(--primary)',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            animation: 'spin 1s linear infinite'
          }}
        />
        
        {/* Inner ring for enhanced visual effect */}
        <div 
          className={`absolute inset-2 rounded-full border-2 border-transparent animate-spin`}
          style={{
            borderTopColor: 'var(--secondary)',
            borderLeftColor: 'var(--accent)',
            borderBottomColor: 'transparent',
            borderRightColor: 'transparent',
            animation: 'spin 0.8s linear infinite reverse'
          }}
        />
        
        {/* Center dot */}
        <div 
          className="absolute inset-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
          style={{
            backgroundColor: 'var(--primary)',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Loading text */}
      {text && (
        <p 
          className={`mt-4 ${textSizeClasses[size]} font-medium`}
          style={{ color: 'var(--muted-foreground)' }}
        >
          {text}
        </p>
      )}
      
      {/* Custom keyframes for smoother animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 0.5; 
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
