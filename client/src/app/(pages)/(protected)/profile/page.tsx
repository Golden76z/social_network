'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { userApi } from '@/lib/api/user'; // Adjust the path if needed
import { UpdateUserRequest } from '@/lib/types';

export default function ProfilePage() {
  const { user, isLoading, hasCheckedAuth, checkAuth } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    nickname: user?.nickname || '',
    bio: user?.bio || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <p className="text-gray-500 text-lg">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <p className="text-red-500 text-lg">You must be logged in to view your profile.</p>
      </div>
    );
  }

  const handleChange = (field: keyof UpdateUserRequest, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: UpdateUserRequest = {
        first_name: formState.first_name,
        last_name: formState.last_name,
        nickname: formState.nickname,
        bio: formState.bio,
      };

      await userApi.updateProfile(payload);

      await checkAuth(); // refresh context state
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormState({
      first_name: user.first_name,
      last_name: user.last_name,
      nickname: user.nickname,
      bio: user.bio || '',
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <div className="grid gap-6">
        {/* Profile Header */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1 space-y-1">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-lg font-semibold"
                    value={formState.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-lg font-semibold"
                    value={formState.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Last Name"
                  />
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-muted-foreground"
                    value={formState.nickname}
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    placeholder="Nickname"
                  />
                  <textarea
                    rows={2}
                    className="w-full border rounded px-2 py-1 text-sm mt-2"
                    value={formState.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Bio"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-muted-foreground">@{user.nickname}</p>
                  <p className="mt-2 text-sm">{user.bio || 'No bio yet.'}</p>
                </>
              )}
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg bg-card text-center">
            {/* <div className="text-2xl font-bold">{user.postsCount ?? 0}</div> */}
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card text-center">
            <div className="text-2xl font-bold">{user.followed ?? 0}</div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card text-center">
            {/* <div className="text-2xl font-bold">{user.groupsCount ?? 0}</div> */}
            <div className="text-sm text-muted-foreground">Groups</div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Your Recent Posts</h3>
          <p className="text-sm text-muted-foreground">Your posts will appear here</p>
        </div>
      </div>
    </div>
  );
}
