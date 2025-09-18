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
  
      // Check if we have a JWT token in cookies first
      const userFromToken = apiClient.getUserFromToken();
      if (!userFromToken || !userFromToken.userid) {
        console.log('🔐 No JWT token found in cookies');
        setUser(null);
        setIsAuthenticated(false);
        setHasCheckedAuth(true);
        setIsLoading(false);
        return;
      }
  
      console.log('🔐 JWT token found, userid:', userFromToken.userid);
      
      // Create a basic user object from the token
      const basicUser: User = {
        id: parseInt(userFromToken.userid),
        email: '', // Will be filled from backend
        first_name: '', // Will be filled from backend
        last_name: '', // Will be filled from backend
        nickname: userFromToken.username || '', // Use username from token
        date_of_birth: '', // Will be filled from backend
        bio: '', // Will be filled from backend
        avatar: '', // Will be filled from backend
        is_private: false, // Will be filled from backend
        created_at: new Date().toISOString(),
        followers: 0, // Will be filled from backend
        followed: 0, // Will be filled from backend
      };

      // Set user immediately from token
      setUser(basicUser);
      setIsAuthenticated(true);
      setHasCheckedAuth(true);
      setIsLoading(false);
      console.log('✅ User set from token:', basicUser);

      // Try to validate with backend in background (non-blocking)
      try {
        const userData = await apiClient.get<{ user: User } | User>('/api/user/profile');
        
        if (userData) {
          const userInfo = 'user' in userData ? userData.user : userData;
          
          if (userInfo && userInfo.id) {
            setUser(userInfo);
            console.log('✅ User updated from backend:', userInfo);
          }
        }
      } catch (backendError) {
        console.log('⚠️ Backend validation failed, but keeping token-based auth:', backendError);
        // Keep the token-based user, don't clear auth state
      }
      
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setHasCheckedAuth(true);
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login...');
      
      const loginData: LoginRequest = { email, password };
      const loginResponse = await apiClient.post(authRoutes.login, loginData);
      
      console.log('✅ Login successful:', loginResponse);
      
      // After successful login, fetch user profile data
      try {
        const userData = await apiClient.get<{ user: User } | User>('/api/user/profile');
        if (userData) {
          const userInfo = 'user' in userData ? userData.user : userData;
          if (userInfo && userInfo.id) {
            setUser(userInfo);
            setIsAuthenticated(true);
            console.log('✅ User set from profile response:', userInfo);
          } else {
            throw new Error('Invalid user data received from profile');
          }
        } else {
          throw new Error('No user data received from profile');
        }
      } catch (profileError) {
        console.error('❌ Failed to fetch user profile:', profileError);
        // Fallback: try to get basic user info from token
        const userFromToken = apiClient.getUserFromToken();
        if (userFromToken && userFromToken.userid) {
          const basicUser: User = {
            id: parseInt(userFromToken.userid),
            email: email, // Use email from login
            first_name: '', // Will be filled from backend
            last_name: '', // Will be filled from backend
            nickname: userFromToken.username || '', // Use username from token
            date_of_birth: '', // Will be filled from backend
            bio: '', // Will be filled from backend
            avatar: '', // Will be filled from backend
            is_private: false, // Will be filled from backend
            created_at: new Date().toISOString(),
            followers: 0, // Will be filled from backend
            followed: 0, // Will be filled from backend
          };
          setUser(basicUser);
          setIsAuthenticated(true);
          console.log('✅ User set from token fallback:', basicUser);
        } else {
          throw new Error('No user data received from login or profile');
        }
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      console.log('📝 Attempting registration...');
      
      const registerResponse = await apiClient.post(authRoutes.register, userData);
      
      console.log('✅ Registration successful:', registerResponse);
      
      // After successful registration, fetch user profile data
      try {
        const userData = await apiClient.get<{ user: User } | User>('/api/user/profile');
        if (userData) {
          const userInfo = 'user' in userData ? userData.user : userData;
          if (userInfo && userInfo.id) {
            setUser(userInfo);
            setIsAuthenticated(true);
            console.log('✅ User set from profile response:', userInfo);
          } else {
            throw new Error('Invalid user data received from profile');
          }
        } else {
          throw new Error('No user data received from profile');
        }
      } catch (profileError) {
        console.error('❌ Failed to fetch user profile:', profileError);
        // Fallback: try to get basic user info from token
        const userFromToken = apiClient.getUserFromToken();
        if (userFromToken && userFromToken.userid) {
          const basicUser: User = {
            id: parseInt(userFromToken.userid),
            email: userData.email, // Use email from registration
            first_name: userData.first_name, // Use data from registration
            last_name: userData.last_name, // Use data from registration
            nickname: userFromToken.username || userData.nickname, // Use username from token or registration
            date_of_birth: userData.date_of_birth, // Use data from registration
            bio: userData.bio || '', // Use data from registration
            avatar: userData.avatar || '', // Use data from registration
            is_private: userData.is_private || false, // Use data from registration
            created_at: new Date().toISOString(),
            followers: 0, // Will be filled from backend
            followed: 0, // Will be filled from backend
          };
          setUser(basicUser);
          setIsAuthenticated(true);
          console.log('✅ User set from token fallback:', basicUser);
        } else {
          throw new Error('No user data received from registration or profile');
        }
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Call logout endpoint
      await apiClient.post(authRoutes.logout, {});
    } catch (error) {
      console.error('⚠️ Logout endpoint failed:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Clear any stored tokens
      document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      console.log('✅ Logout completed');
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasCheckedAuth,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};