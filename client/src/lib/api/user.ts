// src/lib/api/user.ts
import { apiClient } from '.';
import { userRoutes } from '@/constants/routes';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface FollowRequest {
  userId: string;
}

export const userApi = {
  // GET /api/user/profile
  getProfile: (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(userRoutes.profile);
  },
  
  // PUT /api/user/profile  
  updateProfile: (data: UpdateProfileRequest): Promise<UserProfile> => {
    return apiClient.put<UserProfile>(userRoutes.profile, data);
  },
  
  // GET /api/user/notifications
  getNotifications: (): Promise<Notification[]> => {
    return apiClient.get<Notification[]>(userRoutes.notifications);
  },
  
  // POST /api/user/follow
  followUser: (data: FollowRequest): Promise<void> => {
    return apiClient.post<void>(userRoutes.follow, data);
  },
  
  // GET /api/user/follower?userId=123
  getFollowers: (userId: string): Promise<UserProfile[]> => {
    return apiClient.get<UserProfile[]>(`${userRoutes.follower}?userId=${userId}`);
  },
  
  // GET /api/user/following?userId=123
  getFollowing: (userId: string): Promise<UserProfile[]> => {
    return apiClient.get<UserProfile[]>(`${userRoutes.following}?userId=${userId}`);
  },
};