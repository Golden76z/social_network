'use client';

import { useState, useEffect } from 'react';
import { uploadPostImage } from '@/lib/api/upload';
import { groupApi } from '@/lib/api/group';
import { compressImageToJpeg } from '@/lib/utils';
import { ImageModal } from './ImageModal';
import { AvatarFileInput } from './ui/avatar-file-input';
import { ModernInput } from './ui/modern-input';
import { ModernTextarea } from './ui/modern-textarea';
import { ModernSection } from './ui/modern-section';
import { ConfirmationModal } from './ui/confirmation-modal';
import { X, Users } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateGroupModal({ 
  isOpen, 
  onClose, 
  onSuccess,
}: CreateGroupModalProps) {
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showImageErrorModal, setShowImageErrorModal] = useState(false);
  const [imageErrorMessage, setImageErrorMessage] = useState('');

  const maxSize = 5 * 1024 * 1024; // 5MB

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = 'Group name is required';
    } else if (title.trim().length < 3) {
      errors.title = 'Group name must be at least 3 characters long';
    } else if (title.trim().length > 50) {
      errors.title = 'Group name must be less than 50 characters';
    }

    // Bio is optional, but if provided, validate it
    if (bio && bio.trim()) {
      if (bio.trim().length < 3) {
        errors.bio = 'Description must be at least 3 characters long if provided';
      } else if (bio.length > 500) {
        errors.bio = 'Description must be less than 500 characters';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAvatarChange = (file: File | null) => {
    // Clean up previous preview
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    
    if (file) {
      // Validate file
      if (!/^image\/(jpeg|jpg|png|gif)$/i.test(file.type)) {
        setImageErrorMessage('Please select a valid image file (JPEG, PNG, or GIF)');
        setShowImageErrorModal(true);
        return;
      }
      if (file.size > maxSize) {
        setImageErrorMessage('Image size must be less than 5MB');
        setShowImageErrorModal(true);
        return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError(null);
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setBio('');
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    setValidationErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let avatarUrl = '';

      // Upload avatar if provided
      if (avatarFile) {
        const compressed = await compressImageToJpeg(avatarFile, 800, 0.85);
        const { url } = await uploadPostImage(compressed);
        avatarUrl = url;
      }

      const groupData = {
        title: title.trim(),
        bio: bio.trim() || undefined,
        avatar: avatarUrl || undefined,
      };

      // Create group
      await groupApi.createGroup(groupData);

      // Reset form and close modal
      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating group';
      setError(message);
      console.error('Error creating group:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden bg-card border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Create New Group
              </h2>
              <p className="text-sm text-muted-foreground">
                Bring people together around a shared interest
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <ModernSection>
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden shadow-lg">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview}
                        alt="Group avatar preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-2xl text-primary font-bold">👥</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Avatar</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a photo to help people recognize your group
                  </p>
                  <AvatarFileInput
                    onChange={handleAvatarChange}
                    onError={(title, message) => {
                      setError(`${title}: ${message}`);
                    }}
                  />
                </div>
              </div>
            </ModernSection>

            {/* Group Information */}
            <ModernSection>
              <ModernInput
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter group name"
                label="Name"
                required
                error={validationErrors.title}
                maxLength={50}
                className="text-lg"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {title.length}/50 characters
              </div>
            </ModernSection>

            <ModernSection>
              <ModernTextarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe what your group is about..."
                label="Description"
                error={validationErrors.bio}
                maxLength={500}
                className="text-lg"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {bio.length}/500 characters
              </div>
            </ModernSection>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Error Modal */}
      <ConfirmationModal
        isOpen={showImageErrorModal}
        onClose={() => setShowImageErrorModal(false)}
        onConfirm={() => setShowImageErrorModal(false)}
        title="Invalid Image"
        message={imageErrorMessage}
        confirmText="OK"
        cancelText=""
        variant="warning"
        isLoading={false}
      />
    </div>
  );
}
