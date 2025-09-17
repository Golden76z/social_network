import { apiClient } from './index';
import { postRoutes } from '@/constants/routes';
import { Post, CreatePostRequest, UpdatePostRequest } from '@/lib/types';

export const postApi = {
  // GET /api/post - Get all posts (with pagination support)
  getAllPosts: (page?: number, limit?: number): Promise<Post[]> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Post[]>(`${postRoutes.base}${query}`);
  },

  // GET /api/post?id={id} - Get specific post by ID
  getPostById: (postId: string | number): Promise<Post> => {
    return apiClient.get<Post>(`${postRoutes.base}?id=${postId}`);
  },

  // GET /api/post/user/{userId} - Get posts by specific user
  getPostsByUser: (userId: number): Promise<Post[]> => {
    return apiClient.get<Post[]>(`${postRoutes.base}?userId=${userId}`);
  },

  // GET /api/post/me - Get current user's posts
  getMyPosts: (): Promise<Post[]> => {
    return apiClient.get<Post[]>(`${postRoutes.base}?me=true`);
  },

  // GET /api/post/liked - Get current user's liked posts
  getLikedPosts: (): Promise<Post[]> => {
    return apiClient.get<Post[]>(`${postRoutes.base}?liked=true`);
  },

  // GET /api/post/commented - Get posts where current user commented
  getCommentedPosts: (): Promise<Post[]> => {
    return apiClient.get<Post[]>(`${postRoutes.base}?commented=true`);
  },

  // POST /api/posts - Create new post
  createPost: (data: CreatePostRequest): Promise<Post> => {
    return apiClient.post<Post>(postRoutes.base, data);
  },

  // PUT /api/posts/{id} - Update specific post
  updatePost: (postId: string | number, data: UpdatePostRequest): Promise<Post> => {
    return apiClient.put<Post>(`${postRoutes.base}/${postId}`, data);
  },

  // DELETE /api/posts/{id} - Delete specific post
  deletePost: (postId: string | number): Promise<void> => {
    return apiClient.delete<void>(`${postRoutes.base}/${postId}`);
  },

//   // GET /api/posts/public - Get only public posts
//   getPublicPosts: (page?: number, limit?: number): Promise<Post[]> => {
//     const params = new URLSearchParams();
//     if (page) params.append('page', page.toString());
//     if (limit) params.append('limit', limit.toString());
//     const query = params.toString() ? `?${params.toString()}` : '';
//     return apiClient.get<Post[]>(`${postRoutes.public}${query}`);
//   },

//   // GET /api/posts/feed - Get personalized feed (following users' posts)
//   getFeed: (page?: number, limit?: number): Promise<Post[]> => {
//     const params = new URLSearchParams();
//     if (page) params.append('page', page.toString());
//     if (limit) params.append('limit', limit.toString());
//     const query = params.toString() ? `?${params.toString()}` : '';
//     return apiClient.get<Post[]>(`${postRoutes.feed}${query}`);
//   },
};