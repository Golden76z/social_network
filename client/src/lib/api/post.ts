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

  // GET /api/post/{id} - Get specific post by ID
  getPostById: (): Promise<Post> => {
    return apiClient.get<Post>(`${postRoutes.base}`);
  },

//   // GET /api/post/user/{userId} - Get posts by specific user
//   getPostsByUser: (userId: number): Promise<Post[]> => {
//     return apiClient.get<Post[]>(`${postRoutes.user}/${userId}`);
//   },

//   // GET /api/post/me - Get current user's posts
//   getMyPosts: (): Promise<Post[]> => {
//     return apiClient.get<Post[]>(postRoutes.me);
//   },

  // POST /api/posts - Create new post
  createPost: (data: CreatePostRequest): Promise<Post> => {
    return apiClient.post<Post>(postRoutes.base, data);
  },

  // PUT /api/posts/{id} - Update specific post
  updatePost: (postId: number, data: UpdatePostRequest): Promise<Post> => {
    return apiClient.put<Post>(`${postRoutes.base}/${postId}`, data);
  },

  // DELETE /api/posts/{id} - Delete specific post
  deletePost: (postId: number): Promise<void> => {
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