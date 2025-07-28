import { apiClient } from './index';
import { authRoutes } from '@/constants/routes';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '@/lib/types';

export const authApi = {
  // POST /auth/login
  login: (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(authRoutes.login, credentials);
  },
  
  // POST /auth/register
  register: (userData: RegisterRequest): Promise<AuthResponse> => {
    // Remove confirmPassword before sending to backend
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = userData;
    return apiClient.post<AuthResponse>(authRoutes.register, registerData);
  },
  
  // POST /auth/logout
  logout: (): Promise<void> => {
    return apiClient.post<void>(authRoutes.logout);
  },

  // POST /auth/forgot-password (if you implement this)
  forgotPassword: (data: ForgotPasswordRequest): Promise<void> => {
    return apiClient.post<void>('/auth/forgot-password', data);
  },

  // POST /auth/reset-password (if you implement this)
  resetPassword: (data: ResetPasswordRequest): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...resetData } = data;
    return apiClient.post<void>('/auth/reset-password', resetData);
  },
};