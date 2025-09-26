/**
 * Utility functions for user-related operations
 * Centralizes common user data processing logic
 */

export interface UserData {
  id?: number;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
}

/**
 * Generate user initials for avatar fallback
 */
export const getUserInitials = (user: UserData): string => {
  if (user.first_name && user.last_name) {
    return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
  } else if (user.nickname) {
    return user.nickname.charAt(0).toUpperCase();
  }
  return 'U';
};

/**
 * Generate user display name
 */
export const getUserDisplayName = (user: UserData): string => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.nickname || 'Unknown User';
};

/**
 * Generate nickname with @ prefix
 */
export const getUserNickname = (user: UserData): string => {
  return user.nickname ? `@${user.nickname}` : '@unknown';
};

/**
 * Get user avatar URL with proper base URL handling
 */
export const getUserAvatarUrl = (user: UserData): string | null => {
  if (!user.avatar) return null;
  
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  if (typeof user.avatar === 'string') {
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    return `${apiBase}${user.avatar}`;
  }
  
  return null;
};

/**
 * Format time ago string
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Check if user has complete profile information
 */
export const hasCompleteProfile = (user: UserData): boolean => {
  return !!(user.first_name && user.last_name && user.nickname);
};

/**
 * Get user's primary identifier for display
 */
export const getUserPrimaryIdentifier = (user: UserData): string => {
  return user.nickname || getUserDisplayName(user);
};
