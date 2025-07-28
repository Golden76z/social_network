import { User } from './user';

export interface Post {
  id: string;
  content: string;
  authorId: string;
  author: User;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface CreatePostRequest {
  content: string;
  images?: File[];
  groupId?: string; // Optional: if posting to a group
}

export interface UpdatePostRequest {
  content?: string;
  images?: string[];
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: User;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  postId: string;
}