import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Post } from '@/lib/types';

export interface PostsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
}

export function usePosts() {
  const [state, setState] = useState<PostsState>({
    posts: [],
    isLoading: false,
    error: null,
  });

  const fetchPosts = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const posts = await apiClient.get<Post[]>('/api/post');
      setState((prev) => ({
        ...prev,
        posts: posts,
        isLoading: false,
      }));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    ...state,
    refreshPosts: fetchPosts,
  };
}