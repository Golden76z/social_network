import { Comment } from '@/lib/types';
import { ProfileThumbnail } from './ProfileThumbnail';

interface CommentItemProps {
  comment: Comment;
  src?: string | null; // optional avatar src if available
}

export function CommentItem({ comment, src }: CommentItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex space-x-3">
      <ProfileThumbnail
        src={src || (comment.avatar as string | undefined)}
        size="md"
        initials={(comment.username || comment.first_name || 'U') as string}
        className="mt-3 flex-shrink-0"
      />
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-base">
              {comment.username || comment.first_name || 'Unknown User'}
            </p>
            <p className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</p>
          </div>
          <p className="text-foreground text-base mt-1">{comment.body}</p>
        </div>
      </div>
    </div>
  );
}
