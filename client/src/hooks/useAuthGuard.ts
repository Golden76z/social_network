"use client"

import { useAuth } from '@/context/AuthProvider';

interface AuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

interface AuthGuardResult {
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  shouldRender: boolean;
  shouldRedirect: boolean;
}

/**
 * Hook for components that need to check authentication status
 * Provides a clean way to handle auth-dependent rendering
 */
export const useAuthGuard = (options: AuthGuardOptions = {}): AuthGuardResult => {
  const { requireAuth = true } = options;
  const { isAuthenticated, hasCheckedAuth, isLoading } = useAuth();

  const isReady = hasCheckedAuth && !isLoading;
  
  let shouldRender = false;
  let shouldRedirect = false;

  if (isReady) {
    if (requireAuth) {
      // Component requires authentication
      shouldRender = isAuthenticated;
      shouldRedirect = !isAuthenticated;
    } else {
      // Component should not be accessible when authenticated (e.g., login page)
      shouldRender = !isAuthenticated;
      shouldRedirect = isAuthenticated;
    }
  }

  return {
    isReady,
    isAuthenticated,
    isLoading,
    shouldRender,
    shouldRedirect
  };
};

/**
 * Hook for components that need to wait for auth check completion
 * Returns true only when auth check is complete
 */
export const useAuthReady = (): boolean => {
  const { hasCheckedAuth, isLoading } = useAuth();
  return hasCheckedAuth && !isLoading;
};

/**
 * Hook for components that need to know if user is authenticated
 * Only returns true when auth check is complete AND user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated, hasCheckedAuth, isLoading } = useAuth();
  return hasCheckedAuth && !isLoading && isAuthenticated;
};
