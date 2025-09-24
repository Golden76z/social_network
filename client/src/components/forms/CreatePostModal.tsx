'use client';

import { useState, useEffect, useRef } from 'react';
import { uploadPostImage } from '@/lib/api/upload';
import { postApi } from '@/lib/api/post';
import { groupApi } from '@/lib/api/group';
import { compressImageToJpeg } from '@/lib/utils';
import { ImageModal } from '../media/ImageModal';
import { EmojiPicker } from '../media/EmojiPicker';
import { ImageIcon, X, Plus } from 'lucide-react';
import { animateModalClose } from '@/lib/utils/modalCloseAnimation';

type LocalImage = { file: File; preview: string };

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isGroupPost?: boolean;
  groupId?: number;
  groupName?: string;
  // Edit mode props
  postId?: number;
  initialTitle?: string;
  initialContent?: string;
  initialImages?: string[];
}

export function CreatePostModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  isGroupPost = false,
  groupId,
  groupName,
  postId,
  initialTitle = '',
  initialContent = '',
  initialImages = [],
}: CreatePostModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const maxImages = 4;
  const maxSize = 5 * 1024 * 1024; // 5MB

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...images];
    for (const f of files) {
      if (next.length >= maxImages) break;
      if (!/^image\/(jpeg|jpg|png|gif)$/i.test(f.type)) continue;
      if (f.size > maxSize) continue;
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setImages(next);
    e.currentTarget.value = '';
  };

  const removeImage = (idx: number) => {
    const next = [...images];
    URL.revokeObjectURL(next[idx].preview);
    next.splice(idx, 1);
    setImages(next);
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
    } else if (direction === 'next' && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const resetForm = () => {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setImages([]);
    setTitle(initialTitle);
    setContent(initialContent);
    setShowEmojiPicker(false);
  };

  // Update state when initial values change (for edit mode)
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      // Upload new images
      const imageUrls: string[] = [];
      for (const item of images) {
        const compressed = await compressImageToJpeg(item.file, 1600, 0.85);
        const { url } = await uploadPostImage(compressed);
        imageUrls.push(url);
      }

      // Combine existing images with new ones
      const allImages = [...initialImages, ...imageUrls];

      if (postId) {
        // Edit existing post
        if (isGroupPost && groupId) {
          await groupApi.updateGroupPost(postId, {
            title,
            body: content,
          });
        } else {
          await postApi.updatePost(postId, {
            title,
            body: content,
            visibility: 'public',
          });
        }
      } else {
        // Create new post
        if (isGroupPost && groupId) {
          await groupApi.createGroupPost({
            group_id: groupId,
            title,
            body: content,
            images: imageUrls,
          });
        } else {
          await postApi.createPost({
            title,
            body: content,
            images: imageUrls,
            visibility: 'public',
          });
        }
      }

      // Reset form and close modal
      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving post';
      console.error(message);
      // You might want to show an error message to the user here
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    animateModalClose(() => {
      resetForm();
      onClose();
    }, backdropRef, contentRef);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={contentRef}
        className="w-full max-w-3xl max-h-[90vh] rounded-lg shadow-lg overflow-hidden bg-card border border-border animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {postId 
                ? (isGroupPost ? 'Edit Group Post' : 'Edit Post')
                : (isGroupPost ? 'Create Group Post' : 'Create a New Post')
              }
            </h2>
            {isGroupPost && groupName && (
              <p className="text-sm mt-1 text-muted-foreground">
                in {groupName}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Title Field */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-semibold text-foreground">
                Title
              </label>
              <input
                id="title"
                type="text"
                maxLength={125}
                placeholder="Add a compelling title..."
                className="w-full p-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-background text-foreground"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Keep it concise and engaging</span>
                <span>{title.length}/125</span>
              </div>
            </div>

            {/* Content Field */}
            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-semibold text-foreground">
                What&apos;s on your mind?
              </label>
              <div className="relative">
                <textarea
                  id="content"
                  placeholder="Share your thoughts, experiences, or ideas..."
                  className="w-full min-h-40 p-4 pr-12 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-background text-foreground"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                
                {/* Emoji Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute bottom-3 right-3 text-primary hover:text-primary/80 transition-colors"
                >
                  😊
                </button>
                
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={(emoji) => setContent(prev => prev + emoji)}
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 px-4 py-3 text-sm font-medium border rounded-lg transition-all duration-200 cursor-pointer group"
                  style={{ 
                    borderColor: 'var(--color-border)', 
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  <ImageIcon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    multiple
                    className="hidden"
                    onChange={onSelectFiles}
                  />
                </label>
                <span className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                  {images.length}/{maxImages} images
                </span>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
                        style={{ borderRadius: 'var(--radius)' }}
                        onClick={() => openImageModal(idx)}
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 w-6 h-6 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ backgroundColor: 'var(--color-destructive)' }}
                        onClick={() => removeImage(idx)}
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 rounded-lg transition-colors duration-200 font-medium border border-border text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="px-8 py-3 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {postId ? 'Saving...' : 'Publishing...'}
                  </span>
                ) : (
                  postId ? 'Save Changes' : 'Publish Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        images={images.map(img => img.preview)}
        currentIndex={selectedImageIndex}
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        onPrevious={() => navigateImage('prev')}
        onNext={() => navigateImage('next')}
      />
    </div>
  );
}
