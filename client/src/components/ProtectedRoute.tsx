"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  requireAuth?: boolean; // If false, redirect authenticated users away (for login/register pages)
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  loadingComponent,
  requireAuth = true
}) => {
  const { isAuthenticated, hasCheckedAuth, isLoading } = useAuth();
  const router = useRouter();

  // Show loading while checking authentication
  if (!hasCheckedAuth || isLoading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Handle authentication requirements
  if (requireAuth) {
    // Route requires authentication
    if (!isAuthenticated) {
      // Redirect to login page
      router.push(redirectTo);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      );
    }
  } else {
    // Route should not be accessible when authenticated (e.g., login/register pages)
    if (isAuthenticated) {
      // Redirect authenticated users away from login/register pages
      router.push('/');
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
    }
  }

  // Render the protected content
  return <>{children}</>;
};


