'use client';

import { ReactNode } from 'react';
import { UserDisplayInfo } from '@/lib/types/user';
import { getUserInitials, getUserDisplayName, getUserAvatarUrl } from '@/lib/utils/userUtils';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

interface UserListProps {
  users: UserDisplayInfo[];
  onlineUsers: { id: number }[];
  onUserClick: (userId: number) => void;
  maxDisplay?: number;
  showOnlineStatus?: boolean;
  className?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onlineUsers,
  onUserClick,
  maxDisplay = 5,
  showOnlineStatus = true,
  className = '',
}) => {
  const onlineUserIdSet = new Set(onlineUsers.map(user => user.id));
  
  const isUserOnline = (userId: number) => {
    return onlineUserIdSet.has(userId);
  };

  const getInitials = (user: UserDisplayInfo) => {
    return getUserInitials(user);
  };

  const getDisplayName = (user: UserDisplayInfo) => {
    return getUserDisplayName(user);
  };

  const displayUsers = users.slice(0, maxDisplay);

  if (displayUsers.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground p-2 ${className}`}>
        No users found
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {displayUsers.map((user) => {
        const isOnline = showOnlineStatus && isUserOnline(user.id);
        
        return (
          <div
            key={user.id}
            onClick={() => onUserClick(user.id)}
            className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium overflow-hidden ${
                isOnline 
                  ? 'border-primary/30 bg-primary/10 text-primary' 
                  : 'border-border/40 bg-muted/40 text-muted-foreground'
              }`}>
                {getUserAvatarUrl(user) ? (
                  <img
                    src={getUserAvatarUrl(user)!}
                    alt={getDisplayName(user)}
                    className={`w-full h-full rounded-full object-cover ${
                      !isOnline ? 'opacity-75' : ''
                    }`}
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = getInitials(user);
                      }
                    }}
                  />
                ) : (
                  getInitials(user)
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                  {getDisplayName(user)}
                </p>
                {user.is_private !== undefined && (
                  <PrivacyBadge isPrivate={user.is_private} size="sm" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">@{user.nickname}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
