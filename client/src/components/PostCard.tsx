import React from 'react';
import {
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Post } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formattedDate = new Date(post.created_at).toLocaleDateString();

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {post.author_avatar?.String ? (
                <img
                  src={post.author_avatar.String}
                  alt={post.author_nickname}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                post.author_nickname.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-sm">{post.author_nickname}</p>
              </div>
              <p className="text-xs text-gray-500">{formattedDate}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {post.title && (
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        )}

        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.body}</p>

        {post.images && post.images.length > 0 && (
          <div className="mb-4">
            {post.images.length === 1 ? (
              <img
                src={post.images[0]}
                alt="Post image"
                className="w-full max-h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              className={`flex items-center space-x-2 text-sm transition-colors text-gray-500 hover:text-red-500`}
            >
              <Heart className={`w-4 h-4`} />
              <span>{post.likes}</span>
            </button>

            <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>0</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};