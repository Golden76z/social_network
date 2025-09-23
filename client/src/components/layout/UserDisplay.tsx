'use client';

import React from 'react';
import { ProfileThumbnail } from './ProfileThumbnail';
import { PrivacyBadge } from '../ui/PrivacyBadge';
import { User } from '@/lib/types/user';

export interface UserDisplayProps {
  user: User | { 
    id?: number;
    nickname?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
    is_private?: boolean;
  };
  size?: 'sm' | 'md' | 'lg' | number;
  showNickname?: boolean;
  showFullName?: boolean;
  showAvatar?: boolean;
  showPrivacyBadge?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * Reusable component for displaying user information consistently
 * Handles nickname, full name, and avatar display patterns
 */
export const UserDisplay: React.FC<UserDisplayProps> = ({
  user,
  size = 'md',
  showNickname = true,
  showFullName = true,
  showAvatar = true,
  showPrivacyBadge = false,
  className = '',
  onClick,
  variant = 'default'
}) => {
  // Generate initials for avatar fallback
  const getInitials = (): string => {
    if (user.first_name && user.last_name) {
      return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
    } else if (user.nickname) {
      return user.nickname.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Generate display name
  const getDisplayName = (): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.nickname || 'Unknown User';
  };

  // Generate nickname with @ prefix
  const getNickname = (): string => {
    return user.nickname ? `@${user.nickname}` : '@unknown';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (variant === 'compact') {
    return (
      <div 
        className={`flex items-center space-x-2 ${className}`}
        onClick={handleClick}
      >
        {showAvatar && (
          <ProfileThumbnail
            src={user.avatar}
            size={size}
            initials={getInitials()}
            className="cursor-pointer"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">
              {getDisplayName()}
            </p>
            {showPrivacyBadge && user.is_private !== undefined && (
              <PrivacyBadge isPrivate={user.is_private} size="sm" />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div 
        className={`flex items-center space-x-3 ${className}`}
        onClick={handleClick}
      >
        {showAvatar && (
          <ProfileThumbnail
            src={user.avatar}
            size={size}
            initials={getInitials()}
            className="cursor-pointer hover:scale-105 transition-transform"
          />
        )}
        <div className="min-w-0 flex-1">
          {showFullName && (
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base text-card-foreground truncate hover:text-primary transition-colors">
                {getDisplayName()}
              </h4>
              {showPrivacyBadge && user.is_private !== undefined && (
                <PrivacyBadge isPrivate={user.is_private} size="sm" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className={`flex items-center space-x-3 ${className}`}
      onClick={handleClick}
    >
      {showAvatar && (
        <ProfileThumbnail
          src={user.avatar}
          size={size}
          initials={getInitials()}
          className="cursor-pointer"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground truncate">
            {getDisplayName()}
          </p>
          {showPrivacyBadge && user.is_private !== undefined && (
            <PrivacyBadge isPrivate={user.is_private} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDisplay;
