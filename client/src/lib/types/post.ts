import { User } from './user';

// Updated to match your Go struct and database schema
export interface Post {
  id: number; // Changed from string to number (INTEGER in DB)
  author_id: number; // Matches backend PostResponse.author_id
  title: string; // Added title field from your DB schema
  body: string; // Changed from content to body to match DB
  visibility: 'public' | 'private'; // Added visibility field
  created_at: string; // Changed from createdAt to match DB
  updated_at?: string; // Changed from updatedAt to match DB

  // Post type and group information (for unified feed)
  post_type?: 'user_post' | 'group_post'; // Type of post
  group_id?: number; // Group ID if this is a group post
  group_name?: string; // Group name if this is a group post

  // Author information
  user_id?: number; // Legacy field, use author_id instead
  author?: User; // User info if populated
  author_nickname?: string;
  author_first_name?: string;
  author_last_name?: string;
  author_avatar?: string;

  // Images
  images?: string[]; // Post images if you implement this

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
  selected_followers?: number[]; // Selected followers for private posts
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
  body: string; // Changed from 'content' to 'body' to match API
  post_id: number;
  user_id: number;
  created_at: string;
  updated_at?: string;

  // User details populated by API
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;

  // Images support
  images?: string[];

  // Optional fields
  likes_count?: number;
  is_liked?: boolean;
}

export interface CreateCommentRequest {
  body: string;
  post_id: number; // Changed to match likely DB schema
  images?: string[];
}

export interface UpdateCommentRequest {
  body: string;
}
