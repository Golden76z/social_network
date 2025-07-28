import { User } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nickname: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  date_of_birth: string;
  avatar?: string;
  bio?: string;
  is_private?: boolean;
}

export interface AuthResponse {
  user: User;
  message?: string;
  // refreshToken?: string;
  expiresIn?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// For password reset functionality
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}