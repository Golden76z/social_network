import { apiClient } from './index';
import { userRoutes } from '@/constants/routes';
import { User, UserProfile, UpdateUserRequest, UserDisplayInfo } from '@/lib/types';

export const userApi = {
  // GET /api/user/profile
  getProfile: (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(userRoutes.profile);
  },
  
  // PUT /api/user/profile  
  updateProfile: (data: UpdateUserRequest): Promise<User> => {
    return apiClient.put<User>(userRoutes.profile, data);
  },
  
  // GET /api/user/profile?id=123
  getUserById: (userId: number): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(`${userRoutes.profile}?id=${userId}`);
  },
  
  // GET /api/user/follower?userId=123
  getFollowers: (userId: number): Promise<UserDisplayInfo[]> => {
    return apiClient.get<UserDisplayInfo[]>(`${userRoutes.follower}?userId=${userId}`);
  },
  
  // GET /api/user/following?userId=123
  getFollowing: (userId: number): Promise<UserDisplayInfo[]> => {
    return apiClient.get<UserDisplayInfo[]>(`${userRoutes.following}?userId=${userId}`);
  },

  // POST /api/user/follow
  followUser: (userId: number): Promise<void> => {
    return apiClient.post<void>(userRoutes.follow, { userId });
  },

  // DELETE /api/user/follow (unfollow)
  unfollowUser: (userId: number): Promise<void> => {
    return apiClient.delete<void>(`${userRoutes.follow}?userId=${userId}`);
  },
};