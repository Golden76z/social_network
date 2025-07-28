/**
 * Service API centralisé
 *
 * Ce service gère toutes les requêtes HTTP vers le backend.
 * Il centralise la logique d'authentification, de gestion d'erreurs
 * et de configuration des requêtes.
 */

import { config } from '@/config/environment';

// Types pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiErrorDetails {
  message: string;
  status: number;
  details?: unknown;
}

// Configuration par défaut des requêtes
const defaultHeaders = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest', // CSRF protection
};

/**
 * Classe pour gérer les requêtes API
 */
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  /**
   * Méthode générique pour faire des requêtes HTTP
   * @param endpoint - L'endpoint de l'API (ex: '/api/user/profile')
   * @param options - Options de la requête fetch
   * @returns Promise avec la réponse parsée
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const requestOptions: RequestInit = {
      credentials: 'include', // Important: envoie les cookies
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, requestOptions);

      // Gestion des erreurs HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message ||
            errorData.error ||
            `HTTP error! status: ${response.status}`,
          response.status,
          errorData,
        );
      }

      // Parsing de la réponse JSON
      const data = await response.json();
      return data;
    } catch (error) {
      // Gestion des erreurs réseau
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Erreur réseau:', error);
      throw new ApiError('Erreur de connexion au serveur', 0, error);
    }
  }

  // Méthodes HTTP simplifiées
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Classe pour gérer les erreurs API
class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Instance singleton du service API
export const apiService = new ApiService();

// Export des types
export { ApiError };
