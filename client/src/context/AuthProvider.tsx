'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authRoutes } from '@/constants/routes';

// Types
interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  nickname: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  password: string;
}

interface LoginResponse {
  user: User;
  message?: string;
}

interface RegisterResponse {
  user: User;
  message?: string;
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

  // Login function - now uses email instead of username
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

      const data: LoginResponse = await apiCall(authRoutes.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
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

  // Register function with enhanced validation
  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      // Client-side validation
      if (!userData.email || !userData.password || !userData.nickname) {
        throw new Error('Email, password, and nickname are required');
      }
      
      if (!userData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const data: RegisterResponse = await apiCall(authRoutes.register, {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};