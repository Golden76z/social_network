import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Post } from '@/lib/types';
import { reactionApi } from '@/lib/api/reaction';

interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onViewDetails?: (postId: number) => void;
  onUserClick?: (userId: number) => void;
  disableLikes?: boolean; // New prop to disable like functionality
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onViewDetails,
  onUserClick,
  disableLikes = false,
}) => {
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Format date
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
    return date.toLocaleDateString();
  };

  // Truncate content to 2 lines
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Update local state immediately for instant UI feedback
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      // Always send a like request - the backend will handle toggle logic
      await reactionApi.createReaction({
        post_id: post.id,
        type: 'like'
      });
      
      // Notify parent component
      onLike?.(post.id);
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert local state on error
      setIsLiked(!newLiked);
      setLikeCount(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(post.id);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => post.author_id && onUserClick?.(post.author_id)}
          >
            {(post as Post & { author_nickname?: string }).author_nickname?.charAt(0) || 'U'}
          </div>
          <div>
            <p 
              className="font-semibold text-sm cursor-pointer hover:text-blue-500 transition-colors"
              onClick={() => post.author_id && onUserClick?.(post.author_id)}
            >
              {(post as Post & { author_nickname?: string }).author_nickname || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
      )}

      {/* Content - Limited to 2 lines */}
      <p className="text-gray-700 mb-3 line-clamp-2">
        {truncateContent(post.body)}
      </p>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="mb-3">
          {post.images.length === 1 ? (
            <Image
              src={post.images[0]}
              alt="Post image"
              width={400}
              height={192}
              className="w-full max-h-48 object-cover rounded-lg cursor-pointer"
              onClick={handleViewDetails}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {post.images.slice(0, 4).map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Post image ${index + 1}`}
                  width={200}
                  height={96}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer"
                  onClick={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
            {disableLikes ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Heart className="w-4 h-4" />
                <span>{likeCount}</span>
              </div>
            ) : (
              <button
                onClick={handleLike}
                disabled={isLoading}
                aria-label={isLiked ? 'Unlike post' : 'Like post'}
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>
            )}

          <button
            onClick={handleComment}
            className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </button>
        </div>

        {/* View Details Button */}
        <button
          onClick={handleViewDetails}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
};