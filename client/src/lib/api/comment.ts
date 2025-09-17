import { apiClient } from './index';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from '@/lib/types';

export const commentApi = {
  // GET /api/comment - Get comments for a post
  getComments: (postId: string | number): Promise<Comment[]> => {
    return apiClient.get(`/api/comment?post_id=${postId}`);
  },

  // GET /api/comment - Get specific comment by ID
  getCommentById: (commentId: string | number): Promise<Comment> => {
    return apiClient.get(`/api/comment?id=${commentId}`);
  },

  // POST /api/comment - Create new comment
  createComment: (data: CreateCommentRequest): Promise<Comment> => {
    return apiClient.post('/api/comment', data);
  },

  // PUT /api/comment - Update specific comment
  updateComment: (commentId: string | number, data: UpdateCommentRequest): Promise<Comment> => {
    return apiClient.put(`/api/comment?id=${commentId}`, data);
  },

  // DELETE /api/comment - Delete specific comment
  deleteComment: (commentId: string | number): Promise<void> => {
    return apiClient.delete('/api/comment', {
      body: JSON.stringify({ id: Number(commentId) }),
    });
  },
};
