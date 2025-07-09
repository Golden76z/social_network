import { Heart, MessageCircle } from "lucide-react";

type PostProps = {
  username: string;
  timeAgo: string;
  content: string;
};

export const Post: React.FC<PostProps> = ({ username, timeAgo, content }) => {
  return (
    <div className="border-b border-gray-100 pb-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-sm">{username}</p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
      </div>

      <p className="text-gray-700 mb-3">{content}</p>

      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <button className="flex items-center space-x-1 hover:text-red-500">
          <Heart className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-blue-500">
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>
    </div>
  );
};
