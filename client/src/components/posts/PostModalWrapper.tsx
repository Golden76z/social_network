'use client';

import { useState, useEffect } from 'react';
import { PostModal } from './PostModal';
import { Post } from '@/lib/types';
import { postApi } from '@/lib/api/post';

interface PostModalWrapperProps {
  postId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (postId: number) => void;
  disableInteractions?: boolean;
  isAuthenticated?: boolean;
  isGroupPost?: boolean;
  currentUserId?: number;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  isDeleting?: boolean;
  isGroupAdmin?: boolean;
}

export const PostModalWrapper: React.FC<PostModalWrapperProps> = ({
  postId,
  isOpen,
  onClose,
  onLike,
  disableInteractions = false,
  isAuthenticated = true,
  isGroupPost = false,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting = false,
  isGroupAdmin = false,
}) => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPost();
    } else {
      setPost(null);
      setError(null);
    }
  }, [isOpen, postId]);

  const fetchPost = async () => {
    if (!postId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedPost = await postApi.getPostById(postId);
      setPost(fetchedPost);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPost(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
        <div 
          className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
        <div 
          className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          <div className="text-destructive mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={fetchPost}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PostModal
      post={post}
      isOpen={isOpen}
      onClose={handleClose}
      onLike={onLike}
      disableInteractions={disableInteractions}
      isAuthenticated={isAuthenticated}
      isGroupPost={isGroupPost}
      currentUserId={currentUserId}
      onEdit={onEdit}
      onDelete={onDelete}
      isDeleting={isDeleting}
      isGroupAdmin={isGroupAdmin}
    />
  );
};
