'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupApi } from '@/lib/api/group';
import { CreateGroupRequest } from '@/lib/types/group';
import { useAuth } from '@/context/AuthProvider';

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<CreateGroupRequest>({
    title: '',
    bio: '',
    avatar: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Group name is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Group name must be at least 3 characters long';
    } else if (formData.title.trim().length > 50) {
      errors.title = 'Group name must be less than 50 characters';
    }

    // Bio is optional, but if provided, validate it
    if (formData.bio && formData.bio.trim()) {
      if (formData.bio.trim().length < 3) {
        errors.bio = 'Description must be at least 3 characters long if provided';
      } else if (formData.bio.length > 500) {
        errors.bio = 'Description must be less than 500 characters';
      }
    }

    // Avatar is optional, but if provided, validate it
    if (formData.avatar && formData.avatar.trim()) {
      if (!isValidUrl(formData.avatar.trim())) {
        errors.avatar = 'Please enter a valid URL';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Only include non-empty fields in the request
      const requestData: CreateGroupRequest = {
        title: formData.title.trim(),
        ...(formData.bio && formData.bio.trim() && { bio: formData.bio.trim() }),
        ...(formData.avatar && formData.avatar.trim() && { avatar: formData.avatar.trim() }),
      };

      const newGroup = await groupApi.createGroup(requestData);
      
      setSuccess(true);
      
      // Redirect to groups page after a short delay
      setTimeout(() => {
        router.push('/groups');
      }, 1500);
      
    } catch (err: any) {
      console.error('Failed to create group:', err);
      
      // Handle different types of errors
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.response?.data) {
        // Handle validation errors from server
        const serverData = err.response.data;
        if (Array.isArray(serverData)) {
          // Handle array of validation errors
          const errorMessages = serverData.map((error: any) => {
            const field = error.Field || error.field || 'Field';
            const message = error.Message || error.message || 'Invalid value';
            
            // Convert field names to user-friendly names
            const friendlyFieldNames: Record<string, string> = {
              'Avatar': 'Avatar URL',
              'Bio': 'Description',
              'Title': 'Group Name',
              'avatar': 'Avatar URL',
              'bio': 'Description',
              'title': 'Group Name'
            };
            
            const friendlyField = friendlyFieldNames[field] || field;
            
            // Convert server messages to user-friendly messages
            let friendlyMessage = message;
            if (message.includes('must be at least 3 characters')) {
              friendlyMessage = 'must be at least 3 characters long';
            } else if (message.includes('must be at least')) {
              friendlyMessage = message.replace('must be at least', 'must be at least');
            }
            
            return `${friendlyField} ${friendlyMessage}`;
          });
          setError(errorMessages.join('. ') + '.');
        } else if (typeof serverData === 'string') {
          setError(serverData);
        } else {
          setError('Validation failed. Please check your input.');
        }
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Failed to create group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/groups');
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Group Created Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Your group "{formData.title}" has been created and you're now the admin.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Redirecting to groups page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold">Create New Group</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Create a new group to bring people together around a shared interest.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          {/* Group Title */}
          <div className="mb-8">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-3">
              Group Name *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter group name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                validationErrors.title 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-transparent'
              }`}
              required
            />
            {validationErrors.title && (
              <p className="text-sm text-red-600 mt-2">{validationErrors.title}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Choose a clear, descriptive name for your group ({formData.title.length}/50 characters)
            </p>
          </div>

          {/* Group Description */}
          <div className="mb-8">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-3">
              Description (optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Describe what this group is about, what members can expect, and any rules or guidelines..."
              rows={5}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none ${
                validationErrors.bio 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-transparent'
              }`}
            />
            {validationErrors.bio && (
              <p className="text-sm text-red-600 mt-2">{validationErrors.bio}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Help people understand what your group is about ({formData.bio?.length || 0}/500 characters)
            </p>
          </div>

          {/* Group Avatar URL */}
          <div className="mb-8">
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-3">
              Avatar URL (optional)
            </label>
            <input
              type="url"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleInputChange}
              placeholder="https://example.com/avatar.jpg"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                validationErrors.avatar 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-transparent'
              }`}
            />
            {validationErrors.avatar && (
              <p className="text-sm text-red-600 mt-2">{validationErrors.avatar}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Add a custom avatar image URL. Leave empty to use a default avatar.
            </p>
            
            {/* Avatar Preview */}
            {formData.avatar && !validationErrors.avatar && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="w-20 h-20 border border-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={formData.avatar} 
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || Object.keys(validationErrors).some(key => validationErrors[key])}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
