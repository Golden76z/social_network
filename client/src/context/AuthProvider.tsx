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
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Starting auth check...');
      console.log('📋 Current cookies:', document.cookie);
      
      // Quick check using cookie presence
      if (!apiClient.isAuthenticated()) {
        console.log('❌ No jwt_token cookie found');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      console.log('✅ JWT token cookie found, verifying with server...');

      // Use the user profile route to check authentication
      const userData = await apiClient.get<{ user: User } | User>('/api/user/profile');
      
      console.log('✅ Auth check successful:', userData);
      
      // Check if the response actually contains user data
      if (userData && typeof userData === 'object' && 'message' in userData) {
        console.log('⚠️ Profile endpoint returned message only:', userData.message);
        throw new Error('Profile endpoint did not return user data');
      }
      
      // Handle different response formats for actual user data
      const userInfo = 'user' in userData ? userData.user : userData;
      
      if (!userInfo || !userInfo.id) {
        console.log('❌ No valid user data received:', userInfo);
        
        // Try to get user data from token as fallback
        const userFromToken = apiClient.getUserFromToken();
        if (userFromToken && userFromToken.userid) {
          const basicUser: User = {
            id: parseInt(userFromToken.userid),
            nickname: userFromToken.username || '',
            email: '',
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
          setUser(null);
          setIsAuthenticated(false);
        }
        return;
      }
      
      setUser(userInfo);
      setIsAuthenticated(true);
      console.log('✅ User set in context:', userInfo);
      
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      
      // Check if it's a 401/403 error (token expired/invalid)
      if (error instanceof Error && error.message.includes('401')) {
        console.log('🔄 Token seems expired, clearing auth state');
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