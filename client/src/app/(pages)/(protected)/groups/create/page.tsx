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
  
  const [formData, setFormData] = useState<CreateGroupRequest>({
    title: '',
    bio: '',
    avatar: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Group title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newGroup = await groupApi.createGroup(formData);
      
      // Redirect to the new group page
      router.push(`/groups/${newGroup.id}`);
      
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Group</h1>
        <p className="text-muted-foreground mt-2">
          Create a new group to bring people together around a shared interest.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Group Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Group Description */}
          <div className="mb-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Describe what this group is about"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Group Avatar URL */}
          <div className="mb-6">
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL (optional)
            </label>
            <input
              type="url"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleInputChange}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave empty to use a default avatar
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
