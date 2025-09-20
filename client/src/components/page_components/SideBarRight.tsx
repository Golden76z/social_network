'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { chatAPI } from '@/lib/api/chat';
import { User } from '@/lib/types/user';

export const SideBarRight: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocketContext();
  const [messageableUsers, setMessageableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Load messageable users (same as group invitation modal)
  useEffect(() => {
    loadMessageableUsers();
  }, []);

  const loadMessageableUsers = async () => {
    try {
      setLoading(true);
      const users = await chatAPI.getMessageableUsers();
      setMessageableUsers(users);
    } catch (error) {
      console.error('Failed to load messageable users:', error);
      setMessageableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
    } else if (user.nickname) {
      return user.nickname.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.nickname || 'Unknown User';
  };

  return (
    <div className="space-y-6">
      {/* Messageable Users */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-4">
          People ({messageableUsers.length})
        </h3>
        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : messageableUsers.length > 0 ? (
            messageableUsers.slice(0, 10).map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={getDisplayName(user)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user)
                    )}
                  </div>
                  {isConnected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getDisplayName(user)}
                  </p>
                  <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                  {user.is_private && (
                    <span className="inline-block mt-1 px-1 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                      Private
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No users available</div>
          )}
        </div>
      </div>
    </div>
  );
};
