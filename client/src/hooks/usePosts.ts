/**
 * Hook usePosts - Gestion de l'état des posts
 *
 * Ce hook fournit une interface simple pour gérer les posts dans les composants React.
 * Il gère l'état de chargement, les erreurs et les données des posts.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  postsService,
  PostResponse,
  CreatePostRequest,
  UpdatePostRequest,
} from '@/services/posts';
import { ApiError } from '@/services/api';

// Types pour l'état des posts
export interface PostsState {
  posts: PostResponse[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface UsePostsReturn extends PostsState {
  // Actions
  createPost: (postData: CreatePostRequest) => Promise<void>;
  updatePost: (postId: number, updateData: UpdatePostRequest) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  refreshPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;

  // Getters
  getPost: (postId: number) => Promise<PostResponse | null>;
  getUserPosts: (userId: number) => Promise<PostResponse[]>;
}

/**
 * Hook pour gérer les posts
 * @param initialLimit - Nombre initial de posts à charger
 * @returns Interface pour gérer les posts
 */
export function usePosts(initialLimit: number = 20): UsePostsReturn {
  const [state, setState] = useState<PostsState>({
    posts: [],
    isLoading: false,
    error: null,
    hasMore: true,
  });

  const [offset, setOffset] = useState(0);
  const [limit] = useState(initialLimit);

  // Fonction pour gérer les erreurs
  const handleError = useCallback((error: unknown) => {
    const errorMessage =
      error instanceof ApiError
        ? error.message
        : "Une erreur inattendue s'est produite";

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  // Fonction pour récupérer les posts
  const fetchPosts = useCallback(
    async (newOffset: number = 0, append: boolean = false) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const newPosts = await postsService.getPosts(limit, newOffset);

        setState((prev) => ({
          ...prev,
          posts: append ? [...prev.posts, ...newPosts] : newPosts,
          isLoading: false,
          hasMore: newPosts.length === limit,
        }));

        setOffset(newOffset + newPosts.length);
      } catch (error) {
        handleError(error);
      }
    },
    [limit, handleError],
  );

  // Charger les posts au montage du composant
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Créer un nouveau post
  const createPost = useCallback(
    async (postData: CreatePostRequest) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        await postsService.createPost(postData);

        // Recharger les posts pour afficher le nouveau post
        await fetchPosts(0, false);
      } catch (error) {
        handleError(error);
      }
    },
    [fetchPosts, handleError],
  );

  // Mettre à jour un post
  const updatePost = useCallback(
    async (postId: number, updateData: UpdatePostRequest) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const updatedPost = await postsService.updatePost(postId, updateData);

        // Mettre à jour le post dans la liste
        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((post) =>
            post.id === postId ? updatedPost : post,
          ),
          isLoading: false,
        }));
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Supprimer un post
  const deletePost = useCallback(
    async (postId: number) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        await postsService.deletePost(postId);

        // Retirer le post de la liste
        setState((prev) => ({
          ...prev,
          posts: prev.posts.filter((post) => post.id !== postId),
          isLoading: false,
        }));
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Recharger les posts
  const refreshPosts = useCallback(async () => {
    setOffset(0);
    await fetchPosts(0, false);
  }, [fetchPosts]);

  // Charger plus de posts (pagination)
  const loadMorePosts = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;

    await fetchPosts(offset, true);
  }, [fetchPosts, state.hasMore, state.isLoading, offset]);

  // Récupérer un post spécifique
  const getPost = useCallback(
    async (postId: number): Promise<PostResponse | null> => {
      try {
        return await postsService.getPost(postId);
      } catch (error) {
        handleError(error);
        return null;
      }
    },
    [handleError],
  );

  // Récupérer les posts d'un utilisateur
  const getUserPosts = useCallback(
    async (userId: number): Promise<PostResponse[]> => {
      try {
        return await postsService.getUserPosts(userId);
      } catch (error) {
        handleError(error);
        return [];
      }
    },
    [handleError],
  );

  return {
    ...state,
    createPost,
    updatePost,
    deletePost,
    refreshPosts,
    loadMorePosts,
    getPost,
    getUserPosts,
  };
}
