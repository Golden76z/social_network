import { useState } from 'react';
import { Comment } from '@/lib/types';
import { ProfileThumbnail } from './ProfileThumbnail';
import { ImageModal } from './ImageModal';

interface CommentItemProps {
  comment: Comment;
  src?: string | null; // optional avatar src if available
}

export function CommentItem({ comment, src }: CommentItemProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080';

  const resolveImage = (src: string) =>
    src.startsWith('http') ? src : `${apiBase}${src}`;

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

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    } else if (direction === 'next' && selectedImageIndex < (comment.images?.length || 0) - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <>
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
            
            {/* Comment Images */}
            {comment.images && comment.images.length > 0 && (
              <div className="mt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {comment.images.map((image, index) => (
                    <img
                      key={index}
                      src={resolveImage(image)}
                      alt={`Comment image ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                      onClick={() => openImageModal(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal for Comment Images */}
      {comment.images && comment.images.length > 0 && (
        <ImageModal
          images={comment.images.map(resolveImage)}
          currentIndex={selectedImageIndex}
          isOpen={isImageModalOpen}
          onClose={closeImageModal}
          onPrevious={() => navigateImage('prev')}
          onNext={() => navigateImage('next')}
        />
      )}
    </>
  );
}
