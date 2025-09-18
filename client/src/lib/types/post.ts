import { User } from './user';

// Updated to match your Go struct and database schema
export interface Post {
  id: number;           // Changed from string to number (INTEGER in DB)
  user_id: number;      // Changed from authorId to user_id to match DB
  title: string;        // Added title field from your DB schema
  body: string;         // Changed from content to body to match DB
  visibility: 'public' | 'private';  // Added visibility field
  created_at: string;   // Changed from createdAt to match DB
  updated_at?: string;  // Changed from updatedAt to match DB
  
  // Author information
  author_id?: number;   // If you add this field to your backend response
  author?: User;        // User info if populated
  author_nickname?: string;
  author_first_name?: string;
  author_last_name?: string;
  
  // Images
  images?: string[];    // Post images if you implement this
  
  // Like/dislike fields
  likes?: number;
  dislikes?: number;
  user_liked?: boolean;
  user_disliked?: boolean;
}

// Create request (matches your Go struct)
export interface CreatePostRequest {
  title: string;
  body: string;
  visibility: 'public' | 'private';
  images?: string[]; // Your backend validates images but doesn't use File[]
}

// Update request (matches your Go struct)
export interface UpdatePostRequest {
  title?: string;
  body?: string;
  visibility?: 'public' | 'private';
}

// Delete request (matches your Go struct)
export interface DeletePostRequest {
  id: number;
}

// If you still want to support comments later
export interface Comment {
  id: number;
  body: string;          // Changed from 'content' to 'body' to match API
  post_id: number;
  user_id: number;
  created_at: string;
  updated_at?: string;
  
  // User details populated by API
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  
  // Optional fields
  likes_count?: number;
  is_liked?: boolean;
}

export interface CreateCommentRequest {
  body: string;
  post_id: number;      // Changed to match likely DB schema
}

export interface UpdateCommentRequest {
  body: string;
}