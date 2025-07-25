'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authRoutes } from '@/constants/routes';
import { AuthResponse, RegisterRequest, LoginRequest } from '@/lib/types/auth';
import { User } from '@/lib/types/user';

// Auth Context Type - using your existing interfaces
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  // Optional: Add password reset functions if needed
  forgotPassword?: (email: string) => Promise<void>;
  resetPassword?: (token: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8080';

  // Generic API call function with better error handling
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include', // Important: this sends cookies
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      // Debug: Log cookies
      console.log('Cookies:', document.cookie);
      
      // Use the user profile route to check authentication
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      console.log('Auth check response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('Auth check successful:', userData);
        setUser(userData.user || userData);
        setIsAuthenticated(true);
      } else {
        console.log('Auth check failed - response not ok');
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed with error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function - using LoginRequest interface
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Basic client-side validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Create login request object matching your interface
      const loginRequest: LoginRequest = { email, password };

      const data: AuthResponse = await apiCall(authRoutes.login, {
        method: 'POST',
        body: JSON.stringify(loginRequest),
      });

      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - already using RegisterRequest interface
  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      
      // Enhanced client-side validation matching your RegisterRequest interface
      if (!userData.email || !userData.password || !userData.nickname) {
        throw new Error('Email, password, and nickname are required');
      }
      
      if (!userData.first_name || !userData.last_name) {
        throw new Error('First name and last name are required');
      }
      
      if (!userData.date_of_birth) {
        throw new Error('Date of birth is required');
      }
      
      if (!userData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if passwords match (if confirmPassword is provided)
      if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const data: AuthResponse = await apiCall(authRoutes.register, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await apiCall(authRoutes.logout, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Optional: Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      await apiCall('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Reset password function
  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    try {
      setIsLoading(true);
      
      if (!token || !newPassword || !confirmPassword) {
        throw new Error('All fields are required');
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      await apiCall('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};