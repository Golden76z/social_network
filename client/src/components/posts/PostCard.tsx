import React, { useState } from 'react';
// We use <img src="/uploads/..."/> per project choice; disable next/image here.
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Post } from '@/lib/types';
import { reactionApi } from '@/lib/api/reaction';
import { ProfileThumbnail } from '../layout/ProfileThumbnail';
import { UserDisplay } from '../layout/UserDisplay';
import { getUserDisplayName, getUserInitials } from '@/lib/utils/userUtils';

interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onViewDetails?: (postId: number) => void;
  onUserClick?: (userId: number) => void;
  disableLikes?: boolean; // New prop to disable like functionality
  // Author permission props
  currentUserId?: number;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  isDeleting?: boolean;
  // Group-specific props
  isGroupPost?: boolean;
  isGroupAdmin?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onViewDetails,
  onUserClick,
  disableLikes = false,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting = false,
  isGroupPost = false,
  isGroupAdmin = false,
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080';

  const getAuthorAvatarUrl = (): string => {
    const raw = (post as Post & { author_avatar?: unknown })
      .author_avatar as unknown;
    let s = '' as string;
    if (typeof raw === 'string') s = raw;
    else if (raw && typeof raw === 'object') {
      const anyRaw = raw as Record<string, unknown>;
      const candidate = (anyRaw.String ??
        anyRaw.string ??
        anyRaw.value) as unknown;
      if (typeof candidate === 'string') s = candidate;
    }
    if (!s) return '';
    return s.startsWith('http') ? s : `${apiBase}${s}`;
  };

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
    setLikeCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      // Always send a like request - the backend will handle toggle logic
      await reactionApi.createReaction({
        post_id: post.id,
        type: 'like',
      });

      // Notify parent component
      onLike?.(post.id);
    } catch (error) {
      console.error('Error toggling like:', error);

      // Revert local state on error
      setIsLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? Math.max(0, prev - 1) : prev + 1));
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

  const handleEdit = () => {
    onEdit?.(post);
  };

  const handleDelete = () => {
    onDelete?.(post);
  };

  // Determine if current user can edit/delete this post
  const canEdit = currentUserId && (
    isGroupAdmin || // Group admin can edit any group post
    (post.author_id === currentUserId || post.user_id === currentUserId) // Author can edit their own post
  );
  
  const canDelete = currentUserId && (
    isGroupAdmin || // Group admin can delete any group post
    (post.author_id === currentUserId || post.user_id === currentUserId) // Author can delete their own post
  );

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-4 hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <UserDisplay
            user={{
              id: post.author_id || post.user_id,
              nickname: (post as Post & { author_nickname?: string }).author_nickname,
              first_name: (post as Post & { author_first_name?: string }).author_first_name,
              last_name: (post as Post & { author_last_name?: string }).author_last_name,
              avatar: getAuthorAvatarUrl(),
              is_private: (post as Post & { author_is_private?: boolean }).author_is_private
            }}
            size="md"
            showNickname={false}
            showFullName={true}
            showAvatar={true}
            showPrivacyBadge={true}
            onClick={() =>
              (post.author_id || post.user_id) &&
              onUserClick?.(post.author_id || post.user_id)
            }
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
          <div className="flex items-center gap-2">
            {post.post_type === 'group_post' && post.group_name && (
              <button
                onClick={() => post.group_id && router.push(`/groups/${post.group_id}/info`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary hover:bg-primary/20 hover:border-primary/30 transition-all duration-200 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">{post.group_name}</span>
              </button>
            )}
            <span className="text-muted-foreground text-sm">•</span>
            <p className="text-sm text-muted-foreground">
              {formatDate(post.created_at)}
            </p>
          </div>
        </div>
        
        {/* Action buttons - only show if user has permissions */}
        {(canEdit || canDelete) && (
          <div className="flex gap-1">
            {canEdit && (
              <button 
                onClick={handleEdit}
                className="p-1 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground rounded-full transition-colors"
                title="Edit post"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-red-500 disabled:opacity-50 rounded-full transition-colors"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
      )}

      {/* Content - Limited to 2 lines */}
      <p className="text-foreground mb-3 line-clamp-2 text-base">
        {truncateContent(post.body)}
      </p>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="mb-3">
          {post.images.length === 1 ? (
            <img
              src={
                post.images[0].startsWith('http')
                  ? post.images[0]
                  : `${
                      process.env.NEXT_PUBLIC_API_URL ||
                      process.env.NEXT_PUBLIC_API_BASE_URL ||
                      'http://localhost:8080'
                    }${post.images[0]}`
              }
              alt="Post image"
              className="w-full max-h-48 object-cover rounded-lg cursor-pointer"
              onClick={handleViewDetails}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {post.images.slice(0, 4).map((image, index) => (
                <img
                  key={index}
                  src={
                    image.startsWith('http')
                      ? image
                      : `${
                          process.env.NEXT_PUBLIC_API_URL ||
                          process.env.NEXT_PUBLIC_API_BASE_URL ||
                          'http://localhost:8080'
                        }${image}`
                  }
                  alt={`Post image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer"
                  onClick={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center space-x-6">
          {disableLikes ? (
            <div className="flex items-center space-x-2 text-base text-muted-foreground">
              <Heart className="w-4 h-4" />
              <span>{likeCount}</span>
            </div>
          ) : (
            <button
              onClick={handleLike}
              disabled={isLoading}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
              className={`flex items-center space-x-2 text-base transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:text-red-500'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
          )}

          <button
            onClick={handleComment}
            className="flex items-center space-x-2 text-base text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </button>
        </div>

        {/* View Details Button */}
        <button
          onClick={handleViewDetails}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
