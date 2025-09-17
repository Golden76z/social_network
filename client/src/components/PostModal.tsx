import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, Heart, MessageCircle, Send } from 'lucide-react';
import { Post, Comment } from '@/lib/types';
import { commentApi } from '@/lib/api/comment';
import { reactionApi } from '@/lib/api/reaction';
import { CommentItem } from './CommentItem';

interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (postId: number) => void;
}

export const PostModal: React.FC<PostModalProps> = ({ post, isOpen, onClose, onLike }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const loadComments = useCallback(async () => {
    if (!post) return;
    
    setIsLoadingComments(true);
    try {
      const commentsData = await commentApi.getComments(post.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [post]);

  useEffect(() => {
    if (post && isOpen) {
      loadComments();
      setIsLiked(post.user_liked || false);
      setLikeCount(post.likes || 0);
    }
  }, [post, isOpen, loadComments]);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
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

  const handleSubmitComment = async () => {
    if (!post || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await commentApi.createComment({
        post_id: post.id,
        body: newComment.trim(),
      });
      setNewComment('');
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
      await reactionApi.createReaction({
        post_id: post.id,
        type: 'like'
      });
      
      // Notify parent component to refresh
      onLike?.(post.id);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

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


  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Post Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Post Content */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                {(post as Post & { author_nickname?: string }).author_nickname?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {(post as Post & { author_nickname?: string }).author_nickname || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
              </div>
            </div>

            {post.title && (
              <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            )}

            <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.body}</p>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="mb-3">
                {post.images.length === 1 ? (
                  <Image
                    src={post.images[0]}
                    alt="Post image"
                    width={800}
                    height={384}
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.map((image, index) => (
                      <Image
                        key={index}
                        src={image}
                        alt={`Post image ${index + 1}`}
                        width={400}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{comments.length} comments</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-4">
            <h3 className="font-semibold mb-3">Comments</h3>
            
            {/* Add Comment */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingComment ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {isLoadingComments ? (
                <p className="text-gray-500 text-center py-4">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
