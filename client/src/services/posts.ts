/**
 * Service Posts - Gestion des posts
 *
 * Ce service centralise toutes les opérations liées aux posts :
 * - Création de posts
 * - Récupération de posts
 * - Mise à jour de posts
 * - Suppression de posts
 * - Gestion des erreurs spécifiques aux posts
 */

import { apiService, ApiError } from './api';

// Types pour les posts
export interface Post {
  id: number;
  user_id: number;
  title: string;
  body: string;
  images: string[];
  visibility: 'public' | 'private';
  created_at: string;
  updated_at?: string;
}

export interface CreatePostRequest {
  title: string;
  body: string;
  images?: string[];
  visibility: 'public' | 'private';
}

export interface UpdatePostRequest {
  title?: string;
  body?: string;
  images?: string[];
  visibility?: 'public' | 'private';
}

export interface PostResponse {
  id: number;
  post_type: 'user_post' | 'group_post';
  author_id: number;
  author_nickname: string;
  author_avatar: string | null;
  title: string;
  body: string;
  created_at: string;
  updated_at: string | null;
  images: string[];
  group_id?: number;
  group_name?: string;
}

export interface CreatePostResponse {
  message: string;
  postID: number;
}

/**
 * Classe pour gérer les posts
 */
class PostsService {
  private baseEndpoint = '/api/post';

  /**
   * Créer un nouveau post
   * @param postData - Données du post à créer
   * @returns Promise avec l'ID du post créé
   */
  async createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
    try {
      // Validation côté client
      if (!postData.title || !postData.body) {
        throw new ApiError('Le titre et le contenu sont requis', 400);
      }

      if (postData.title.length > 125) {
        throw new ApiError('Le titre ne peut pas dépasser 125 caractères', 400);
      }

      if (postData.body.length > 2200) {
        throw new ApiError(
          'Le contenu ne peut pas dépasser 2200 caractères',
          400,
        );
      }

      if (postData.images && postData.images.length > 4) {
        throw new ApiError('Vous ne pouvez pas ajouter plus de 4 images', 400);
      }

      return await apiService.post<CreatePostResponse>(
        this.baseEndpoint,
        postData,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la création du post', 500);
    }
  }

  /**
   * Récupérer un post spécifique par son ID
   * @param postId - ID du post à récupérer
   * @returns Promise avec les données du post
   */
  async getPost(postId: number): Promise<PostResponse> {
    try {
      if (!postId || postId <= 0) {
        throw new ApiError('ID de post invalide', 400);
      }

      return await apiService.get<PostResponse>(
        `${this.baseEndpoint}?id=${postId}`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la récupération du post', 500);
    }
  }

  /**
   * Récupérer tous les posts (feed)
   * @param limit - Nombre maximum de posts à récupérer
   * @param offset - Offset pour la pagination
   * @returns Promise avec la liste des posts
   */
  async getPosts(
    limit: number = 20,
    offset: number = 0,
  ): Promise<PostResponse[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      return await apiService.get<PostResponse[]>(
        `${this.baseEndpoint}?${params}`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la récupération des posts', 500);
    }
  }

  /**
   * Mettre à jour un post existant
   * @param postId - ID du post à mettre à jour
   * @param updateData - Nouvelles données du post
   * @returns Promise avec le post mis à jour
   */
  async updatePost(
    postId: number,
    updateData: UpdatePostRequest,
  ): Promise<PostResponse> {
    try {
      if (!postId || postId <= 0) {
        throw new ApiError('ID de post invalide', 400);
      }

      // Validation des données de mise à jour
      if (updateData.title && updateData.title.length > 125) {
        throw new ApiError('Le titre ne peut pas dépasser 125 caractères', 400);
      }

      if (updateData.body && updateData.body.length > 2200) {
        throw new ApiError(
          'Le contenu ne peut pas dépasser 2200 caractères',
          400,
        );
      }

      if (updateData.images && updateData.images.length > 4) {
        throw new ApiError('Vous ne pouvez pas ajouter plus de 4 images', 400);
      }

      return await apiService.put<PostResponse>(
        `${this.baseEndpoint}/${postId}`,
        updateData,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la mise à jour du post', 500);
    }
  }

  /**
   * Supprimer un post
   * @param postId - ID du post à supprimer
   * @returns Promise avec le message de confirmation
   */
  async deletePost(postId: number): Promise<{ message: string }> {
    try {
      if (!postId || postId <= 0) {
        throw new ApiError('ID de post invalide', 400);
      }

      return await apiService.delete<{ message: string }>(
        `${this.baseEndpoint}/${postId}`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la suppression du post', 500);
    }
  }

  /**
   * Récupérer les posts d'un utilisateur spécifique
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre maximum de posts à récupérer
   * @param offset - Offset pour la pagination
   * @returns Promise avec la liste des posts de l'utilisateur
   */
  async getUserPosts(
    userId: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PostResponse[]> {
    try {
      if (!userId || userId <= 0) {
        throw new ApiError("ID d'utilisateur invalide", 400);
      }

      const params = new URLSearchParams({
        user_id: userId.toString(),
        limit: limit.toString(),
        offset: offset.toString(),
      });

      return await apiService.get<PostResponse[]>(
        `${this.baseEndpoint}?${params}`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors de la récupération des posts de l'utilisateur",
        500,
      );
    }
  }

  /**
   * Formater la date de création pour l'affichage
   * @param dateString - Date au format string
   * @returns Date formatée pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "À l'instant";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }
}

// Instance singleton du service Posts
export const postsService = new PostsService();
