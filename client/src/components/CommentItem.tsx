import { Comment } from '@/lib/types';

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
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
      <div className="mt-3 w-10 h-10 bg-muted rounded-full flex items-center justify-center text-base font-medium flex-shrink-0">
        {comment.username?.charAt(0) || comment.first_name?.charAt(0) || 'U'}
      </div>
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
