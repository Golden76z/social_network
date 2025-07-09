'use client';

import { AuthProvider } from "./AuthProvider";

// Auth Provider Component
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};