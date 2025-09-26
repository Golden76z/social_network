'use client';

import { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { EmojiPicker } from '../media/EmojiPicker';
import { ImageModal } from '../media/ImageModal';
import { compressImageToJpeg } from '@/lib/utils';
import { uploadPostImage } from '@/lib/api/upload';

type LocalImage = { file: File; preview: string };

interface CommentFormProps {
  onSubmit: (data: { body: string; images: string[] }) => Promise<void>;
  placeholder?: string;
  submitting?: boolean;
}

export function CommentForm({ onSubmit, placeholder = "Write a comment...", submitting = false }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && images.length === 0) return;

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const item of images) {
        const compressed = await compressImageToJpeg(item.file, 1200, 0.8);
        const { url } = await uploadPostImage(compressed);
        imageUrls.push(url);
      }

      // Submit comment
      await onSubmit({ body: body.trim(), images: imageUrls });

      // Reset form
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setImages([]);
      setBody('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Text Input with Emoji Support */}
        <div className="relative">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            style={{ 
              borderColor: 'var(--color-border)', 
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius)',
              minHeight: '60px'
            }}
            rows={2}
            maxLength={1000}
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700 transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            😊
          </button>
          
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiSelect={(emoji) => setBody(prev => prev + emoji)}
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-all duration-200 cursor-pointer group"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-16 object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    style={{ borderRadius: 'var(--radius)' }}
                    onClick={() => openImageModal(idx)}
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 w-5 h-5 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={(!body.trim() && images.length === 0) || submitting}
            className="px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
            style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'var(--color-primary-foreground)',
              borderRadius: 'var(--radius)'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {submitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </form>

      {/* Image Modal */}
      <ImageModal
        images={images.map(img => img.preview)}
        currentIndex={selectedImageIndex}
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        onPrevious={() => navigateImage('prev')}
        onNext={() => navigateImage('next')}
      />
    </>
  );
}
