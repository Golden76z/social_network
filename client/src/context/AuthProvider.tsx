'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authRoutes } from '@/constants/routes';
import { AuthResponse, RegisterRequest, LoginRequest } from '@/lib/types/auth';
import { User } from '@/lib/types/user';
import { apiClient } from '@/lib/api';

// Auth Context Type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCheckedAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Starting auth check...');
  
      // Check if we have a JWT token in cookies first
      const userFromToken = apiClient.getUserFromToken();
      if (!userFromToken || !userFromToken.userid) {
        console.log('🔐 No JWT token found in cookies');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
  
      // Try to validate the token with the backend
      const userData = await apiClient.get<{ user: User } | User>('/api/user/profile');
  
      console.log('✅ Auth check response:', userData);
  
      // Handle both { user: ... } and raw user object formats
      const userInfo = 'user' in userData ? userData.user : userData;
  
      // If user data is valid, update context
      if (userInfo && userInfo.id) {
        setUser(userInfo);
        setIsAuthenticated(true);
        console.log('✅ User set in context:', userInfo);
      } else {
        throw new Error('No valid user data returned from profile endpoint');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Auth check failed:', error);
  
      // Handle expired/invalid token case
      if (error.message?.includes('401') || error.message?.includes('403') || 
          error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
        console.log('🔐 Token expired or invalid. Clearing auth state and reloading page.');
        
        // Clear the invalid token by calling logout
        try {
          await apiClient.post(authRoutes.logout);
        } catch (logoutError) {
          console.error('Error clearing invalid token:', logoutError);
        }
        
        // Reload the page to clear all state
        if (typeof window !== 'undefined') {
          window.location.reload();
          return;
        }
      }
  
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
      console.log('🏁 Auth check completed');
    }
  };
  

  // Login function
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

      // Create login request object
      const loginRequest: LoginRequest = { email, password };

      const data = await apiClient.post<AuthResponse>(authRoutes.login, loginRequest);
      
      console.log('✅ Login response:', data);

      // If login response contains user data, use it
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        console.log('✅ User set from login response:', data.user);
      } else {
        // If login response doesn't contain user data, fetch it from profile
        console.log('🔄 Login successful, fetching user profile...');
        
        try {
          const profileData = await apiClient.get<{ user: User } | User>('/api/user/profile');
          console.log('✅ Profile data fetched:', profileData);
          
          const userInfo = 'user' in profileData ? profileData.user : profileData;
          
          if (userInfo && userInfo.id) {
            setUser(userInfo);
            setIsAuthenticated(true);
            console.log('✅ User set from profile:', userInfo);
          } else {
            throw new Error('No user data received from profile endpoint');
          }
        } catch (profileError) {
          console.error('❌ Failed to fetch profile after login:', profileError);
          // Try to get basic user info from token as fallback
          const userFromToken = apiClient.getUserFromToken();
          if (userFromToken && userFromToken.userid) {
            const basicUser: User = {
              id: parseInt(userFromToken.userid),
              nickname: userFromToken.username || '',
              email: email, // We know the email from login
              first_name: '',
              last_name: '',
              date_of_birth: '',
              is_private: false,
              created_at: '',
              followers: 0,
              followed: 0
            };
            setUser(basicUser);
            setIsAuthenticated(true);
            console.log('✅ User set from token fallback:', basicUser);
          } else {
            throw new Error('Could not get user data after login');
          }
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      
      // Enhanced client-side validation
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

      // Check if passwords match
      if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const data = await apiClient.post<AuthResponse>(authRoutes.register, userData);

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
      await apiClient.post(authRoutes.logout);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Reload the page to clear any cached state
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  // Optional: Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      await apiClient.post('/api/auth/forgot-password', { email });
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

      await apiClient.post('/api/auth/reset-password', { 
        token, 
        newPassword, 
        confirmPassword 
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
    console.log('🚀 AuthProvider mounted, checking auth...');
    checkAuth();
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔄 Auth state changed:', { 
      isAuthenticated, 
      hasUser: !!user, 
      isLoading, 
      hasCheckedAuth,
      username: user?.nickname 
    });
  }, [isAuthenticated, user, isLoading, hasCheckedAuth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasCheckedAuth,
    login,
    register,
    logout,
    checkAuth,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
