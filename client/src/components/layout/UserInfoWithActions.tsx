'use client';

import React from 'react';
import { UserDisplay } from './UserDisplay';
import { User } from '@/lib/types/user';

export interface UserInfoWithActionsProps {
  user: User | { 
    id?: number;
    nickname?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
  };
  size?: 'sm' | 'md' | 'lg' | number;
  showNickname?: boolean;
  showFullName?: boolean;
  showAvatar?: boolean;
  className?: string;
  onUserClick?: () => void;
  actions?: React.ReactNode;
  timestamp?: string;
  subtitle?: string;
  variant?: 'notification' | 'list' | 'card';
}

/**
 * Enhanced user display component with actions and additional info
 * Used in notifications, user lists, and interactive contexts
 */
export const UserInfoWithActions: React.FC<UserInfoWithActionsProps> = ({
  user,
  size = 'md',
  showNickname = true,
  showFullName = true,
  showAvatar = true,
  className = '',
  onUserClick,
  actions,
  timestamp,
  subtitle,
  variant = 'list'
}) => {
  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick();
    }
  };

  if (variant === 'notification') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleUserClick}
        >
          <UserDisplay
            user={user}
            size={size}
            showNickname={false}
            showFullName={false}
            showAvatar={showAvatar}
            variant="compact"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className="font-semibold text-primary cursor-pointer hover:underline text-sm"
              onClick={handleUserClick}
            >
              {user.nickname || 'Unknown User'}
            </span>
            {subtitle && (
              <span className="text-sm text-foreground">
                {subtitle}
              </span>
            )}
          </div>
          {timestamp && (
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`group ${className}`}>
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
          <div onClick={handleUserClick} className="cursor-pointer">
            <UserDisplay
              user={user}
              size={size}
              showNickname={showNickname}
              showFullName={showFullName}
              showAvatar={showAvatar}
              variant="detailed"
            />
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
        {timestamp && (
          <p className="text-xs text-muted-foreground px-3 pb-2">{timestamp}</p>
        )}
      </div>
    );
  }

  // Default list variant
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div onClick={handleUserClick} className="cursor-pointer flex-1 min-w-0">
        <UserDisplay
          user={user}
          size={size}
          showNickname={showNickname}
          showFullName={showFullName}
          showAvatar={showAvatar}
          variant="compact"
        />
      </div>
      {actions && (
        <div className="flex-shrink-0 ml-3">
          {actions}
        </div>
      )}
      {timestamp && (
        <div className="flex-shrink-0 ml-2">
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        </div>
      )}
    </div>
  );
};

export default UserInfoWithActions;
