"use client"

import { useState, useEffect } from 'react';
import { UserCheck, Users, Hash } from 'lucide-react';
import { GroupResponse } from '@/lib/types/group';
import { UserDisplayInfo } from '@/lib/types/user';
import { groupApi } from '@/lib/api/group';
import { userApi } from '@/lib/api/user';
import { useAuth } from '@/context/AuthProvider';
import Button from '@/components/ui/button';

interface ChatPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: UserDisplayInfo) => void;
  onGroupSelect: (group: GroupResponse) => void;
}

export function ChatPlusModal({ isOpen, onClose, onUserSelect, onGroupSelect }: ChatPlusModalProps) {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<GroupResponse[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<UserDisplayInfo[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMutualFollowers, setLoadingMutualFollowers] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoadingGroups(true);
      setLoadingMutualFollowers(true);
      
      // Load user's groups and mutual followers in parallel
      const [groups, followers, following] = await Promise.all([
        groupApi.getUserGroups(),
        userApi.getFollowers(user.id),
        userApi.getFollowing(user.id)
      ]);
      
      setUserGroups(groups || []);
      
      // Find mutual followers (users who follow you and you follow back)
      const followersSet = new Set(followers.map(f => f.id));
      const mutual = following.filter(followingUser => 
        followersSet.has(followingUser.id)
      );
      
      setMutualFollowers(mutual);
    } catch (error) {
      console.error('Failed to load chat data:', error);
      setUserGroups([]);
      setMutualFollowers([]);
    } finally {
      setLoadingGroups(false);
      setLoadingMutualFollowers(false);
    }
  };

  const handleUserClick = (user: UserDisplayInfo) => {
    onUserSelect(user);
    onClose();
  };

  const handleGroupClick = (group: GroupResponse) => {
    onGroupSelect(group);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Start New Chat
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Groups Section */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Your Groups ({userGroups.length})
            </h4>
            
            {loadingGroups ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading groups...</p>
              </div>
            ) : userGroups.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">You're not a member of any groups yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {userGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    className="w-full p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
                        {group.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-card-foreground">
                          {group.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {group.bio || 'No description'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mutual Followers Section */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mutual Friends ({mutualFollowers.length})
            </h4>
            
            {loadingMutualFollowers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading mutual friends...</p>
              </div>
            ) : mutualFollowers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No mutual friends found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mutualFollowers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="w-full p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {user.avatar ? (
                          <img
                            src={user.avatar.startsWith('http') 
                              ? user.avatar 
                              : `http://localhost:8080${user.avatar}`}
                            alt={user.nickname || 'User'}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium ${user.avatar ? 'hidden' : ''}`}>
                          {user.nickname ? user.nickname.charAt(0).toUpperCase() : '?'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-card-foreground">
                          {user.nickname || `${user.first_name} ${user.last_name}`.trim() || 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
