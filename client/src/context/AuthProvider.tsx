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
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
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
  // Initialize auth state based on token presence
  const getInitialAuthState = () => {
    if (typeof window === 'undefined') return false;
    
    try {
      const userFromToken = apiClient.getUserFromToken();
      const isExpired = apiClient.isTokenExpired();
      const hasValidToken = !!(userFromToken && userFromToken.userid && !isExpired);
      console.log('🔍 Initial auth state check:', {
        hasUserFromToken: !!userFromToken,
        userid: userFromToken?.userid,
        isExpired,
        hasValidToken
      });
      return hasValidToken;
    } catch (error) {
      console.error('❌ Error in getInitialAuthState:', error);
      return false;
    }
  };

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Always start as false, let checkAuth() determine the real state
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // New state to track initial setup

  // Check if user is authenticated (no backend dependency for initial check)
  const checkAuth = async () => {
    try {
      console.log('🔍 Starting auth check...', { hasCheckedAuth, isInitializing });
      
      // Wait a bit to ensure cookies are available (especially after page reload)
      if (typeof window !== 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
  
      // Check if we have a JWT token in cookies first
      const userFromToken = apiClient.getUserFromToken();
      console.log('🔍 User from token:', userFromToken);
      
      if (!userFromToken || !userFromToken.userid) {
        console.log('🔐 No JWT token found in cookies');
        setUser(null);
        setIsAuthenticated(false);
        setHasCheckedAuth(true);
        setIsLoading(false);
        setIsInitializing(false);
        return;
      }

      // Check if token is expired
      const isExpired = apiClient.isTokenExpired();
      console.log('🔍 Token expired check:', isExpired);
      
      if (isExpired) {
        console.log('🔐 JWT token has expired');
        // Clear expired token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jwt_token');
        }
        setUser(null);
        setIsAuthenticated(false);
        setHasCheckedAuth(true);
        setIsLoading(false);
        setIsInitializing(false);
        return;
      }
  
      console.log('🔐 Valid JWT token found, userid:', userFromToken.userid);
      
      // Create a basic user object from the token
      const basicUser: User = {
        id: parseInt(userFromToken.userid),
        email: '', // Will be filled from backend later
        first_name: '', // Will be filled from backend later
        last_name: '', // Will be filled from backend later
        nickname: userFromToken.username || '', // Use username from token
        date_of_birth: '', // Will be filled from backend later
        bio: '', // Will be filled from backend later
        avatar: '', // Will be filled from backend later
        is_private: false, // Will be filled from backend later
        created_at: new Date().toISOString(),
        followers: 0, // Will be filled from backend later
        followed: 0, // Will be filled from backend later
      };

      // Set user immediately from token (this makes auth work instantly)
      setUser(basicUser);
      setIsAuthenticated(true);
      setHasCheckedAuth(true);
      setIsLoading(false);
      setIsInitializing(false);
      console.log('✅ User set from token:', basicUser);

      // Try to fetch full profile in background (non-critical)
      refreshUserProfile();
      
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setHasCheckedAuth(true);
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  // Separate method to refresh user profile from backend
  const refreshUserProfile = async () => {
    try {
      console.log('🔄 Refreshing user profile from backend...');
      const userData = await apiClient.get<{ user: User } | User>('/api/user/profile');
      
      if (userData) {
        const userInfo = 'user' in userData ? userData.user : userData;
        
        if (userInfo && userInfo.id) {
          setUser(userInfo);
          console.log('✅ User profile updated from backend:', userInfo);
        }
      }
    } catch (error) {
      console.log('⚠️ Background profile refresh failed (non-critical):', error);
      // Don't clear auth state - token-based auth is still valid
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
      
      // Store token in localStorage if provided
      if (loginResponse && typeof loginResponse === 'object' && 'token' in loginResponse) {
        const token = (loginResponse as any).token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('jwt_token', token);
          console.log('🔑 JWT token stored in localStorage');
        }
      }
      
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
        console.error('❌ Failed to fetch user profile after login:', profileError);
        // Fallback: try to get basic user info from token
        const userFromToken = apiClient.getUserFromToken();
        if (userFromToken && userFromToken.userid) {
          const basicUser: User = {
            id: parseInt(userFromToken.userid),
            email: email, // Use email from login
            first_name: '', 
            last_name: '', 
            nickname: userFromToken.username || '', 
            date_of_birth: '', 
            bio: '', 
            avatar: '', 
            is_private: false, 
            created_at: new Date().toISOString(),
            followers: 0, 
            followed: 0, 
          };
          setUser(basicUser);
          setIsAuthenticated(true);
          console.log('✅ User set from token fallback after login:', basicUser);
        } else {
          throw new Error('No user data received from login or profile');
        }
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
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
        const userDataResponse = await apiClient.get<{ user: User } | User>('/api/user/profile');
        if (userDataResponse) {
          const userInfo = 'user' in userDataResponse ? userDataResponse.user : userDataResponse;
          if (userInfo && userInfo.id) {
            setUser(userInfo);
            setIsAuthenticated(true);
            console.log('✅ User set from profile response after registration:', userInfo);
          } else {
            throw new Error('Invalid user data received from profile');
          }
        } else {
          throw new Error('No user data received from profile');
        }
      } catch (profileError) {
        console.error('❌ Failed to fetch user profile after registration:', profileError);
        // Fallback: try to get basic user info from token
        const userFromToken = apiClient.getUserFromToken();
        if (userFromToken && userFromToken.userid) {
          const basicUser: User = {
            id: parseInt(userFromToken.userid),
            email: userData.email, 
            first_name: userData.first_name, 
            last_name: userData.last_name, 
            nickname: userFromToken.username || userData.nickname, 
            date_of_birth: userData.date_of_birth, 
            bio: userData.bio || '', 
            avatar: userData.avatar || '', 
            is_private: userData.is_private || false, 
            created_at: new Date().toISOString(),
            followers: 0, 
            followed: 0, 
          };
          setUser(basicUser);
          setIsAuthenticated(true);
          console.log('✅ User set from token fallback after registration:', basicUser);
        } else {
          throw new Error('No user data received from registration or profile');
        }
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Clear local state immediately for instant UI feedback
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setIsInitializing(false);
      
      // Clear any stored tokens immediately
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
      }
      
      // Call logout endpoint in background (don't wait for it)
      apiClient.post(authRoutes.logout, {}).catch(error => {
        console.error('⚠️ Logout endpoint failed:', error);
      });
      
      console.log('✅ Logout completed');
      
      // Only redirect if we're not already on the homepage
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        console.log('🚪 Logout: Current path:', currentPath);
        
        // Only redirect if we're on a protected route or auth route
        const protectedRoutes = ['/home', '/profile', '/groups', '/messages', '/notifications'];
        const authRoutes = ['/login', '/register'];
        
        if (protectedRoutes.includes(currentPath) || authRoutes.includes(currentPath)) {
          console.log('🚪 Logout: Redirecting to homepage from:', currentPath);
          window.location.href = '/';
        } else {
          console.log('🚪 Logout: Already on homepage, no redirect needed');
        }
        // If already on homepage (/), no redirect needed
      }
    } catch (error) {
      console.error('⚠️ Logout error:', error);
      // Even if there's an error, still redirect if needed
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const protectedRoutes = ['/home', '/profile', '/groups', '/messages', '/notifications'];
        const authRoutes = ['/login', '/register'];
        
        if (protectedRoutes.includes(currentPath) || authRoutes.includes(currentPath)) {
          window.location.href = '/';
        }
      }
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
    isInitializing,
    login,
    register,
    logout,
    checkAuth,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};