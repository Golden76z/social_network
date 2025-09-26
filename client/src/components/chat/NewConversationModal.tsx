"use client"

import { useEffect, useState, useRef } from 'react';
import { UserDisplayInfo } from '@/lib/types/user';
import { userApi } from '@/lib/api/user';
import { useAuth } from '@/context/AuthProvider';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: UserDisplayInfo) => void;
}

export function NewConversationModal({ isOpen, onClose, onUserSelect }: NewConversationModalProps) {
  const [users, setUsers] = useState<UserDisplayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadMutualFriends();
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadMutualFriends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getMutualFriends(user.id);
      console.log('🔍 getMutualFriends response:', data);
      console.log('🔍 First user in response:', data[0]);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mutual friends');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const nickname = user.nickname?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || nickname.includes(search);
  });

  const getDisplayName = (user: UserDisplayInfo) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.nickname || 'Unknown User';
  };

  const getInitials = (user: UserDisplayInfo) => {
    const name = getDisplayName(user);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div ref={modalRef} className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Start New Conversation</h2>
              <p className="text-sm text-muted-foreground">Choose a mutual friend to message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search mutual friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading mutual friends...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={loadMutualFriends}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-muted-foreground">
                {searchTerm ? 'No mutual friends found matching your search.' : 'No mutual friends available to message.'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Mutual friends are users who follow you and whom you follow back.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    console.log('🔍 User selected in modal:', user);
                    console.log('🔍 User avatar:', user.avatar, 'type:', typeof user.avatar);
                    onUserSelect(user);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-primary font-medium flex-shrink-0">
                    {user.avatar && typeof user.avatar === 'string' ? (
                      <img
                        src={user.avatar}
                        alt={getDisplayName(user)}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full rounded-full flex items-center justify-center text-primary font-medium ${user.avatar && typeof user.avatar === 'string' ? 'hidden' : ''}`}>
                      {getInitials(user)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate text-foreground">{getDisplayName(user)}</p>
                      {user.is_private && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{user.nickname}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


