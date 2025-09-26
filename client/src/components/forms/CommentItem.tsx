import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Comment } from '@/lib/types';
import { ProfileThumbnail } from '../layout/ProfileThumbnail';
import { UserDisplay } from '../layout/UserDisplay';
import { UserInfoWithTime } from '../layout/UserInfoWithTime';
import { ImageModal } from '../media/ImageModal';
import { formatTimeAgo } from '@/lib/utils/userUtils';
import { useAuth } from '@/context/AuthProvider';

interface CommentItemProps {
  comment: Comment;
  src?: string | null; // optional avatar src if available
}

export function CommentItem({ comment, src }: CommentItemProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080';

  const resolveImage = (src: string) =>
    src.startsWith('http') ? src : `${apiBase}${src}`;

  const formatDate = (dateString: string) => {
    return formatTimeAgo(dateString);
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

  const handleUserClick = () => {
    console.log('Comment data:', comment);
    console.log('Comment user_id:', comment.user_id);
    console.log('Comment username:', comment.username);
    console.log('Comment author_id (if different):', (comment as any).author_id);
    
    // Try both user_id and author_id fields in case there's a mismatch
    const targetUserId = comment.user_id || (comment as any).author_id;
    
    if (targetUserId) {
      console.log('Navigating to profile for user_id:', targetUserId);
      if (user) {
        router.push(`/profile?user_id=${targetUserId}`);
      } else {
        router.push('/login');
      }
    } else {
      console.warn('No user_id or author_id found in comment:', comment);
      if (!user) {
        router.push('/login');
      }
    }
  };

  return (
    <>
      <div className="flex space-x-3">
        <UserInfoWithTime
          user={{
            id: comment.user_id || (comment as any).author_id,
            nickname: comment.username,
            first_name: comment.first_name,
            last_name: comment.last_name,
            avatar: src || (comment.avatar as string | undefined)
          }}
          time={formatDate(comment.created_at)}
          size="md"
          onUserClick={handleUserClick}
          className="flex-shrink-0 w-32 items-start"
        />
        <div className="flex-1">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-foreground text-base">{comment.body}</p>
            
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
