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
      return hasValidToken;
    } catch (error) {
      console.error('❌ [API] Error in getInitialAuthState:', error);
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
      // Wait a bit to ensure cookies are available (especially after page reload)
      if (typeof window !== 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
  
      // Check if we have a JWT token in cookies first
      const userFromToken = apiClient.getUserFromToken();
      
      if (!userFromToken || !userFromToken.userid) {
        setUser(null);
        setIsAuthenticated(false);
        setHasCheckedAuth(true);
        setIsLoading(false);
        setIsInitializing(false);
        return;
      }

      // Check if token is expired
      const isExpired = apiClient.isTokenExpired();
      
      if (isExpired) {
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

      // Try to fetch full profile in background (non-critical)
      refreshUserProfile();
      
    } catch (error) {
      console.error('[API] Auth check failed:', error);
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
      const userData = await apiClient.get<{ user: User } | User>('/api/user/profile');
      
      if (userData) {
        const userInfo = 'user' in userData ? userData.user : userData;
        
        if (userInfo && userInfo.id) {
          setUser(userInfo);
        }
      }
    } catch (error) {
      // Don't clear auth state - token-based auth is still valid
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const loginData: LoginRequest = { email, password };
      const loginResponse = await apiClient.post(authRoutes.login, loginData);
      
      // Store token in localStorage if provided
      if (loginResponse && typeof loginResponse === 'object' && 'token' in loginResponse) {
        const token = (loginResponse as any).token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('jwt_token', token);
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
      console.log('🚪 LOGOUT FUNCTION CALLED - Starting logout process...');
      
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
      
      // Redirect logic: redirect from protected/auth routes, but not from root homepage
      console.log('🚪 About to check redirect logic...');
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        console.log('🚪 Logout: Current path:', currentPath);
        
        // Normalize path by removing trailing slash for comparison
        const normalizedPath = currentPath.endsWith('/') && currentPath !== '/' ? currentPath.slice(0, -1) : currentPath;
        console.log('🚪 Logout: Normalized path:', normalizedPath);
        
        // Check if we're on the root homepage - if so, don't redirect
        if (normalizedPath === '/' || normalizedPath === '') {
          console.log('🚪 Logout: Already on root homepage, no redirect needed');
          return;
        }
        
        // Define routes that should redirect to homepage after logout
        const protectedRoutes = ['/home', '/profile', '/groups', '/messages', '/notifications', '/settings'];
        const authRoutes = ['/login', '/register'];
        
        console.log('🚪 Logout: Checking against routes:', { protectedRoutes, authRoutes });
        
        // Check if current path is a protected or auth route
        const isProtectedRoute = protectedRoutes.some(route => {
          const matches = normalizedPath === route || normalizedPath.startsWith(route + '/');
          console.log(`🚪 Logout: Checking protected route "${route}" against "${normalizedPath}":`, matches);
          return matches;
        });
        
        const isAuthRoute = authRoutes.some(route => {
          const matches = normalizedPath === route || normalizedPath.startsWith(route + '/');
          console.log(`🚪 Logout: Checking auth route "${route}" against "${normalizedPath}":`, matches);
          return matches;
        });
        
        console.log('🚪 Logout: Final route analysis:', { isProtectedRoute, isAuthRoute, normalizedPath });
        
        if (isProtectedRoute || isAuthRoute) {
          console.log('🚪 Logout: REDIRECTING TO HOMEPAGE from:', currentPath);
          console.log('🚪 Logout: Setting window.location.href to "/"');
          window.location.href = '/';
          console.log('🚪 Logout: Redirect command executed');
        } else {
          console.log('🚪 Logout: On public page, no redirect needed');
        }
      }
    } catch (error) {
      console.error('⚠️ Logout error:', error);
      // Even if there's an error, still redirect if needed
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath.endsWith('/') && currentPath !== '/' ? currentPath.slice(0, -1) : currentPath;
        
        // Don't redirect if already on root homepage
        if (normalizedPath === '/' || normalizedPath === '') {
          return;
        }
        
        const protectedRoutes = ['/home', '/profile', '/groups', '/messages', '/notifications', '/settings'];
        const authRoutes = ['/login', '/register'];
        
        const isProtectedRoute = protectedRoutes.some(route => 
          normalizedPath === route || normalizedPath.startsWith(route + '/')
        );
        const isAuthRoute = authRoutes.some(route => 
          normalizedPath === route || normalizedPath.startsWith(route + '/')
        );
        
        if (isProtectedRoute || isAuthRoute) {
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