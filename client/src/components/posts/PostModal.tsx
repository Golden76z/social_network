import React, { useState, useEffect, useRef, useCallback } from 'react';
// import Image from 'next/image';
import { X, Heart, MessageCircle, Send, Edit, Trash2 } from 'lucide-react';
import { Post, Comment } from '@/lib/types';
import { commentApi } from '@/lib/api/comment';
import { groupApi } from '@/lib/api/group';
import { reactionApi } from '@/lib/api/reaction';
import { postApi } from '@/lib/api/post';
import { CommentItem } from '../forms/CommentItem';
import { ProfileThumbnail } from '../layout/ProfileThumbnail';
import { CommentForm } from '../forms/CommentForm';

interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (postId: number) => void;
  disableInteractions?: boolean; // New prop to disable likes and comments
  isAuthenticated?: boolean; // New prop to indicate if user is authenticated
  isGroupPost?: boolean; // New prop to indicate if this is a group post
  currentUserId?: number; // Current user ID for permission checks
  onEdit?: (post: Post) => void; // Edit post handler
  onDelete?: (post: Post) => void; // Delete post handler
  isDeleting?: boolean; // Loading state for delete operation
  isGroupAdmin?: boolean; // Whether current user is group admin (for group posts)
}

export const PostModal: React.FC<PostModalProps> = ({
  post,
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080';

  const getAuthorAvatarUrl = (): string => {
    if (!post) return '';
    const raw = (post as Post & { author_avatar?: unknown })
      .author_avatar as unknown;
    let s = '' as string;
    if (typeof raw === 'string') s = raw;
    else if (raw && typeof raw === 'object') {
      const anyRaw = raw as Record<string, unknown>;
      const candidate = (anyRaw.String ?? anyRaw.string ?? anyRaw.value) as unknown;
      if (typeof candidate === 'string') s = candidate;
    }
    if (!s) return '';
    return s.startsWith('http') ? s : `${apiBase}${s}`;
  };

  const loadComments = useCallback(async () => {
    if (!post) return;
    
    // Don't load comments if user is not authenticated
    if (!isAuthenticated) {
      setComments([]);
      setIsLoadingComments(false);
      return;
    }
    
    setIsLoadingComments(true);
    try {
      let commentsData: Comment[];
      if (isGroupPost) {
        // For group posts, use group comment API
        commentsData = await groupApi.getGroupComments(post.id) as Comment[];
      } else {
        // For regular posts, use regular comment API
        commentsData = await commentApi.getComments(post.id);
      }
      setComments(commentsData || []); // Ensure it's always an array
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]); // Set empty array on error
    } finally {
      setIsLoadingComments(false);
    }
  }, [post, isAuthenticated, isGroupPost]);

  useEffect(() => {
    if (post && isOpen) {
      loadComments();
      setIsLiked(post.user_liked || false);
      setLikeCount(post.likes || 0);
      setCurrentIndex(0);
    }
  }, [post, isOpen, loadComments]);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      const total = post?.images?.length || 0;
      if (e.key === 'ArrowRight' && isOpen && total > 1) {
        setCurrentIndex((idx) => (idx + 1) % total);
      }
      if (e.key === 'ArrowLeft' && isOpen && total > 1) {
        setCurrentIndex((idx) => (idx - 1 + total) % total);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmitComment = async (data: { body: string; images: string[] }) => {
    if (!post || (!data.body.trim() && data.images.length === 0)) return;

    setIsSubmittingComment(true);
    try {
      if (isGroupPost) {
        // For group posts, use group comment API
        await groupApi.createGroupComment({
          group_post_id: post.id,
          body: data.body.trim(),
          images: data.images,
        });
      } else {
        // For regular posts, use regular comment API
        await commentApi.createComment({
          post_id: post.id,
          body: data.body.trim(),
          images: data.images,
        });
      }
      loadComments(); // Reload comments
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!post || isLiking) return;
    
    setIsLiking(true);
    try {
      // Always send a like request - the backend will handle toggle logic
      if (isGroupPost) {
        // For group posts, use group_post_id
        await reactionApi.createReaction({
          group_post_id: post.id,
          type: 'like'
        });
      } else {
        // For regular posts, use post_id
        await reactionApi.createReaction({
          post_id: post.id,
          type: 'like'
        });
      }

      // Update local state optimistically
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

      // Notify parent component to refresh
      onLike?.(post.id);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = () => {
    if (post && onEdit) {
      onEdit(post);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (post && onDelete) {
      await onDelete(post);
      setShowDeleteConfirm(false);
      onClose(); // Close modal after deletion
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const canEditOrDelete = currentUserId && post && (
    post.user_id === currentUserId || 
    (isGroupPost && isGroupAdmin)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  // const apiBase =
  //   process.env.NEXT_PUBLIC_API_URL ||
  //   process.env.NEXT_PUBLIC_API_BASE_URL ||
  //   'http://localhost:8080';
  const resolveImage = (src: string) =>
    src.startsWith('http') ? src : `${apiBase}${src}`;
  const count = post?.images?.length || 0;
  const hasMultiple = count > 1;
  const onPrev = () => {
    if (count < 1) return;
    setCurrentIndex((idx) => (idx - 1 + count) % count);
  };
  const onNext = () => {
    if (count < 1) return;
    setCurrentIndex((idx) => (idx + 1) % count);
  };

  if (!isOpen || !post) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-w-4xl w-full max-h-[95vh] overflow-hidden rounded-lg shadow-lg"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          borderRadius: 'var(--radius)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center space-x-4">
            {/* Author Info */}
            <div className="flex items-center space-x-3">
              <ProfileThumbnail
                src={getAuthorAvatarUrl()}
                size="sm"
                initials={post.author_nickname || post.author_first_name || 'U'}
                className="flex-shrink-0"
              />
              <div>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {post.author_nickname || post.author_first_name || 'Unknown User'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>
            
            {/* Separator */}
            <div className="h-8 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
            
            {/* Post Title */}
            <h2 id="modal-title" className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              {post.title}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Edit and Delete buttons */}
            {canEditOrDelete && !disableInteractions && (
              <>
                <button
                  onClick={handleEdit}
                  aria-label="Edit post"
                  className="p-1 rounded-full transition-colors"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  aria-label="Delete post"
                  className="p-1 rounded-full transition-colors disabled:opacity-50"
                  style={{ color: 'var(--color-destructive)' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 rounded-full transition-colors"
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Post Content */}
          <div className="p-4 border-b border-gray-200">
            {/* Post body content */}
            <p className="mb-3 whitespace-pre-wrap text-base text-gray-900">
              {post.body}
            </p>

            {/* Images with carousel */}
            {post.images && post.images.length > 0 && (
              <div className="mb-3">
                <div className="relative">
                  <img
                    src={resolveImage(
                      post.images[hasMultiple ? currentIndex : 0],
                    )}
                    alt={`Post image ${hasMultiple ? currentIndex + 1 : 1}`}
                    className="w-full max-h-96 object-cover"
                    style={{ borderRadius: 'var(--radius)' }}
                  />

                  {hasMultiple && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={onPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={onNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        }}
                      >
                        ›
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                          borderRadius: 'var(--radius)' 
                        }}
                      >
                        {currentIndex + 1}/{post.images.length}
                      </div>
                    </>
                  )}
                </div>

                {hasMultiple && (
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {post.images.map((thumb, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`border rounded overflow-hidden ${
                          currentIndex === idx ? 'ring-2 ring-primary' : ''
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      >
                        <img
                          src={resolveImage(thumb)}
                          alt={`thumb ${idx + 1}`}
                          className="w-full h-12 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-6 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {disableInteractions ? (
                <div className="flex items-center space-x-2 text-base" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                  <Heart className="w-4 h-4" />
                  <span>{likeCount}</span>
                </div>
              ) : (
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  aria-label={isLiked ? 'Unlike post' : 'Like post'}
                  className={`flex items-center space-x-2 text-base transition-colors ${
                    isLiking ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ 
                    color: isLiked ? 'var(--color-destructive)' : 'var(--color-text)',
                    opacity: isLiked ? 1 : 0.7
                  }}
                  onMouseEnter={(e) => {
                    if (!isLiking) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLiking) {
                      e.currentTarget.style.opacity = isLiked ? '1' : '0.7';
                    }
                  }}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                  />
                  <span>{likeCount}</span>
                </button>
              )}

              <div className="flex items-center space-x-2 text-base" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                <MessageCircle className="w-4 h-4" />
                <span>{comments?.length || 0} comments</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-4">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Comments</h3>

            {/* Add Comment */}
            {!disableInteractions && isAuthenticated && (
              <div className="mb-4">
                <CommentForm
                  onSubmit={handleSubmitComment}
                  placeholder="Write a comment..."
                  submitting={isSubmittingComment}
                />
              </div>
            )}

            {/* Sign in prompt for unauthenticated users */}
            {!isAuthenticated && (
              <div className="mb-4 p-3 text-center" style={{ backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius)' }}>
                <p className="text-base mb-2" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                  Sign in to view and add comments
                </p>
                <div className="space-x-2">
                  <a
                    href="/login"
                    className="inline-block px-3 py-1 text-base rounded transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-primary)', 
                      color: 'var(--color-primary-foreground)',
                      borderRadius: 'var(--radius)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    Sign In
                  </a>
                  <a
                    href="/register"
                    className="inline-block px-3 py-1 text-base rounded transition-colors"
                    style={{ 
                      borderColor: 'var(--color-border)', 
                      color: 'var(--color-text)',
                      borderRadius: 'var(--radius)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Sign Up
                  </a>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {!isAuthenticated ? (
                <p className="text-center py-4 text-base" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                  Sign in to view comments
                </p>
              ) : isLoadingComments ? (
                <p className="text-center py-4 text-base" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                  Loading comments...
                </p>
              ) : !comments || comments.length === 0 ? (
                <p className="text-center py-4 text-base" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} src={comment.avatar as string | undefined} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDeleteCancel();
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Delete Post
              </h3>
              <button
                onClick={handleDeleteCancel}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">{post?.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">{post?.body}</p>
              </div>

              <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm border border-destructive/20">
                <p className="font-medium mb-1">⚠️ Warning</p>
                <p>Are you sure you want to delete this post? This action cannot be undone and all comments and reactions will be lost.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg btn-delete disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
