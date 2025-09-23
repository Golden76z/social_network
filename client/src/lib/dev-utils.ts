/**
 * Development utilities for environment-based access control
 */

export const isDevelopmentEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_ENV === 'development' ||
         process.env.ENV === 'development';
};

export const isDevPageAccessAllowed = (): boolean => {
  // Allow dev pages only in development environment
  return isDevelopmentEnvironment();
};

export const getDevAccessMessage = (): string => {
  return `
🚫 Development pages are only accessible in development environment.

Current environment: ${process.env.NODE_ENV || 'unknown'}
Required environment: development

To access development pages:
1. Set NODE_ENV=development
2. Or set NEXT_PUBLIC_ENV=development
3. Or set ENV=development
  `.trim();
};
