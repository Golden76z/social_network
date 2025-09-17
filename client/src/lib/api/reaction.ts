import { apiClient } from './index';

export interface CreateReactionRequest {
  post_id?: number;
  comment_id?: number;
  group_post_id?: number;
  group_comment_id?: number;
  type: 'like' | 'dislike';
}

export interface UpdateReactionRequest {
  id: number;
  type: 'like' | 'dislike';
}

export interface DeleteReactionRequest {
  id: number;
  type?: string;
}

export interface ReactionResponse {
  id: number;
  user_id: number;
  post_id?: number;
  comment_id?: number;
  group_post_id?: number;
  group_comment_id?: number;
  type: string;
  created_at: string;
}

export const reactionApi = {
  // POST /api/reaction - Create a new reaction (like/dislike)
  createReaction: (data: CreateReactionRequest): Promise<{ response: string }> => {
    return apiClient.post('/api/reaction', data);
  },

  // GET /api/reaction - Get reaction by ID
  getReaction: (id: number): Promise<ReactionResponse> => {
    return apiClient.get(`/api/reaction?id=${id}`);
  },

  // PUT /api/reaction - Update reaction type
  updateReaction: (data: UpdateReactionRequest): Promise<{ response: string }> => {
    return apiClient.put('/api/reaction', data);
  },

  // DELETE /api/reaction - Delete reaction
  deleteReaction: (data: DeleteReactionRequest): Promise<{ response: string }> => {
    return apiClient.delete('/api/reaction', { body: JSON.stringify(data) });
  },
};
