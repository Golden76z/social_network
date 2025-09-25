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
  
  // GET /api/user/profile?id=123 (authenticated) or /api/public/user/profile?id=123 (public)
  getUserById: (userId: number): Promise<UserProfile> => {
    // Use authenticated endpoint if user is logged in, otherwise use public endpoint
    const endpoint = apiClient.isAuthenticated() 
      ? `${userRoutes.profile}?id=${userId}`
      : `${userRoutes.publicProfile}?id=${userId}`;
    return apiClient.get<UserProfile>(endpoint);
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
    return apiClient.post<void>(userRoutes.follow, { target_id: userId });
  },

  // DELETE /api/user/follow (unfollow)
  unfollowUser: (userId: number): Promise<void> => {
    return apiClient.delete<void>(userRoutes.follow, { target_id: userId });
  },

  // POST /api/user/follow/cancel (cancel follow request)
  cancelFollowRequest: (userId: number): Promise<void> => {
    return apiClient.post<void>('/api/user/follow/cancel', { 
      target_id: userId 
    });
  },

  // GET /api/user/mutual-friends?userId=123
  getMutualFriends: (userId: number): Promise<UserDisplayInfo[]> => {
    return apiClient.get<UserDisplayInfo[]>(`${userRoutes.mutualFriends}?userId=${userId}`);
  },

  // GET /api/user/followers-for-post - Get followers for post creation (private posts)
  getFollowersForPost: (): Promise<UserDisplayInfo[]> => {
    return apiClient.get<UserDisplayInfo[]>('/api/user/followers-for-post');
  },
};