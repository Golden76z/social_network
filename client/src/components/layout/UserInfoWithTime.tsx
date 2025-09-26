'use client';

import React from 'react';
import { ProfileThumbnail } from './ProfileThumbnail';
import { getUserInitials } from '@/lib/utils/userUtils';

export interface UserInfoWithTimeProps {
  user: {
    id?: number;
    nickname?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
  };
  time: string;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
  onUserClick?: () => void;
}

/**
 * Reusable component for displaying user information with time
 * Shows: Avatar + Nickname + Time (3 lines)
 * Used consistently across posts, comments, and modals
 */
export const UserInfoWithTime: React.FC<UserInfoWithTimeProps> = ({
  user,
  time,
  size = 'md',
  className = '',
  onUserClick
}) => {
  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick();
    }
  };

  // Determine if we should use items-start or items-center based on className
  const alignmentClass = className.includes('items-start') ? 'items-start' : 'items-center';
  
  return (
    <div className={`flex ${alignmentClass} space-x-3 ${className}`}>
      <ProfileThumbnail
        src={user.avatar || undefined}
        size={size}
        initials={getUserInitials({
          nickname: user.nickname,
          first_name: user.first_name,
          last_name: user.last_name
        })}
        className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
      />
      <div className="flex flex-col min-w-0 w-full">
        <p 
          className="text-sm font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity truncate"
          onClick={handleUserClick}
          title={user.nickname || 'Unknown User'}
        >
          {user.nickname || 'Unknown User'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {time}
        </p>
      </div>
    </div>
  );
};

export default UserInfoWithTime;
