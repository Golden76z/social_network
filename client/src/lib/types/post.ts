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
  
  // Your backend doesn't populate these fields currently
  author_id?: number;   // If you add this field to your backend response
  author?: User;        // User info if populated
  images?: string[];    // Post images if you implement this
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
  content: string;
  post_id: number;      // Changed to match likely DB schema
  user_id: number;      // Changed to match likely DB schema
  author?: User;
  created_at: string;
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