import { Post } from '@/lib/types';

interface PostHeaderProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
}

export function PostHeader({ post, onLike, onComment }: PostHeaderProps) {
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
    <div className="flex items-start space-x-3 mb-4">
      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-medium flex-shrink-0">
        {(post as any).author_nickname?.charAt(0) || (post as any).author_avatar || 'U'}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-lg">
            {(post as any).author_nickname || 'Unknown User'}
          </h3>
          <span className="text-gray-500 text-sm">•</span>
          <p className="text-gray-500 text-sm">{formatDate(post.created_at)}</p>
        </div>
        <h2 className="text-xl font-bold mt-2">{post.title}</h2>
        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{post.body}</p>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-6 mt-4">
          <button
            onClick={onLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              post.user_liked 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill={post.user_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likes || 0}</span>
          </button>
          
          <button
            onClick={onComment}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
