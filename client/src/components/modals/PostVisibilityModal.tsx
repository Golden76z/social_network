'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Users, Lock, Plus, Minus, UserPlus } from 'lucide-react';
import { postApi } from '@/lib/api/post';
import { userApi } from '@/lib/api/user';
import { animateModalClose } from '@/lib/utils/modalCloseAnimation';

interface User {
  id: number;
  nickname: string;
  fullName: string;
  first_name: string;
  last_name: string;
  avatar?: string;
}

interface PostVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  onSuccess?: () => void;
}

export function PostVisibilityModal({
  isOpen,
  onClose,
  postId,
  onSuccess,
}: PostVisibilityModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [availableFollowers, setAvailableFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load current visibility users and available followers
  useEffect(() => {
    if (isOpen && postId) {
      loadData();
    }
  }, [isOpen, postId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUsersData, availableFollowersData] = await Promise.all([
        postApi.getPostVisibility(postId),
        userApi.getFollowersForPost()
      ]);
      
      setCurrentUsers(currentUsersData);
      
      // Filter out users who are already selected
      const currentUserIds = currentUsersData.map(u => u.id);
      const filteredFollowers = availableFollowersData.filter(f => !currentUserIds.includes(f.id));
      setAvailableFollowers(filteredFollowers);
    } catch (error) {
      console.error('Failed to load visibility data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = (user: User) => {
    setCurrentUsers(prev => [...prev, user]);
    setAvailableFollowers(prev => prev.filter(u => u.id !== user.id));
  };

  const removeUser = (user: User) => {
    setCurrentUsers(prev => prev.filter(u => u.id !== user.id));
    setAvailableFollowers(prev => [...prev, user]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await postApi.updatePostVisibility(postId, currentUsers.map(u => u.id));
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to update post visibility:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    animateModalClose(() => {
      setSearchTerm('');
      setShowAddUsers(false);
      onClose();
    }, backdropRef, contentRef);
  };

  // Filter users based on search term
  const filteredCurrentUsers = currentUsers.filter((user) =>
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableFollowers = availableFollowers.filter((user) =>
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={contentRef}
        className="w-full max-w-3xl max-h-[80vh] rounded-lg shadow-lg overflow-hidden bg-card border border-border animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Manage Post Visibility
              </h2>
              <p className="text-sm text-muted-foreground">
                Control who can see this private post
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-background text-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Current Users Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Who can see this post
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {currentUsers.length} user{currentUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {filteredCurrentUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users selected</p>
                    <p className="text-sm mt-2">This post will only be visible to you</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCurrentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                      >
                        <img
                          src={user.avatar || '/default-avatar.png'}
                          alt={user.nickname}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {user.nickname}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.fullName}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => removeUser(user)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                          title="Remove access"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Users Section */}
              {availableFollowers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowAddUsers(!showAddUsers)}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add more users
                      <span className="text-muted-foreground">
                        ({availableFollowers.length} available)
                      </span>
                    </button>
                  </div>

                  {showAddUsers && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredAvailableFollowers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => addUser(user)}
                        >
                          <img
                            src={user.avatar || '/default-avatar.png'}
                            alt={user.nickname}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/default-avatar.png';
                            }}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {user.nickname}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.fullName}
                            </p>
                          </div>
                          
                          <div className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {currentUsers.length > 0 ? (
              <span>
                {currentUsers.length} user{currentUsers.length !== 1 ? 's' : ''} can see this post
              </span>
            ) : (
              <span>Only you can see this post</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg transition-colors text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
