import { GroupResponse, GroupMemberWithUser, GroupPost, GroupEvent } from '@/lib/types/group';

// Mock utility functions for testing
export const groupUtils = {
  /**
   * Get the display name for a group member
   */
  getMemberDisplayName: (member: GroupMemberWithUser): string => {
    if (member.nickname) return member.nickname;
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    if (member.first_name) return member.first_name;
    return 'Unknown User';
  },

  /**
   * Check if a user is a group admin
   */
  isGroupAdmin: (member: GroupMemberWithUser): boolean => {
    return member.role === 'admin';
  },

  /**
   * Get member count display text
   */
  getMemberCountText: (count: number): string => {
    return count === 1 ? '1 member' : `${count} members`;
  },

  /**
   * Format event datetime for display
   */
  formatEventDateTime: (dateTimeString: string): string => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  },

  /**
   * Check if an event is upcoming
   */
  isEventUpcoming: (dateTimeString: string): boolean => {
    try {
      const eventDate = new Date(dateTimeString);
      const now = new Date();
      return eventDate > now;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get group avatar or default emoji
   */
  getGroupAvatar: (group: GroupResponse): string | null => {
    if (group.avatar) return group.avatar;
    
    // Generate emoji based on group title
    const emojis = ['👥', '📚', '💻', '🍳', '🎨', '🏃', '🎵', '🎮', '📷', '🌱'];
    const index = group.title.charCodeAt(0) % emojis.length;
    return emojis[index];
  },

  /**
   * Check if user can edit a post
   */
  canEditPost: (post: GroupPost, userId: number, isAdmin: boolean): boolean => {
    return isAdmin || post.user_id === userId;
  },

  /**
   * Check if user can edit an event
   */
  canEditEvent: (event: GroupEvent, userId: number, isAdmin: boolean): boolean => {
    return isAdmin || event.creator_id === userId;
  },

  /**
   * Get post author display name
   */
  getPostAuthorName: (post: GroupPost): string => {
    return post.author_nickname || 'Group Member';
  },

  /**
   * Get event creator display name
   */
  getEventCreatorName: (event: GroupEvent): string => {
    return event.creator_nickname || 'Group Member';
  },

  /**
   * Sort group members by role (admin first, then by join date)
   */
  sortGroupMembers: (members: GroupMemberWithUser[]): GroupMemberWithUser[] => {
    return [...members].sort((a, b) => {
      // Admins first
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      
      // Then by join date (earliest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  },

  /**
   * Generate gradient colors for group cards
   */
  getGroupGradientColors: (title: string): string => {
    const colors = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-blue-500',
      'from-orange-500 to-red-500',
      'from-purple-500 to-pink-500',
      'from-red-500 to-yellow-500',
      'from-blue-500 to-green-500',
    ];
    const index = title.charCodeAt(0) % colors.length;
    return colors[index];
  },
};

describe('groupUtils', () => {
  const mockMember: GroupMemberWithUser = {
    id: 1,
    group_id: 1,
    user_id: 1,
    role: 'member',
    invited_by: null,
    created_at: '2023-01-01T00:00:00Z',
    nickname: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    avatar: '',
  };

  const mockGroup: GroupResponse = {
    id: 1,
    title: 'Test Group',
    bio: 'Test bio',
    avatar: '',
    creator_id: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockPost: GroupPost = {
    id: 1,
    user_id: 1,
    title: 'Test Post',
    body: 'Test content',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    visibility: 'public',
    images: [],
    likes: 0,
    dislikes: 0,
    user_liked: false,
    user_disliked: false,
    author_nickname: 'testuser',
  };

  const mockEvent: GroupEvent = {
    id: 1,
    group_id: 1,
    creator_id: 1,
    title: 'Test Event',
    description: 'Test description',
    event_datetime: '2023-12-01T10:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    creator_nickname: 'testuser',
  };

  describe('getMemberDisplayName', () => {
    it('should return nickname when available', () => {
      const result = groupUtils.getMemberDisplayName(mockMember);
      expect(result).toBe('testuser');
    });

    it('should return full name when nickname is not available', () => {
      const memberWithoutNickname = { ...mockMember, nickname: '' };
      const result = groupUtils.getMemberDisplayName(memberWithoutNickname);
      expect(result).toBe('Test User');
    });

    it('should return first name only when last name is not available', () => {
      const memberWithoutLastName = { ...mockMember, nickname: '', last_name: '' };
      const result = groupUtils.getMemberDisplayName(memberWithoutLastName);
      expect(result).toBe('Test');
    });

    it('should return Unknown User when no name information is available', () => {
      const memberWithoutNames = { ...mockMember, nickname: '', first_name: '', last_name: '' };
      const result = groupUtils.getMemberDisplayName(memberWithoutNames);
      expect(result).toBe('Unknown User');
    });
  });

  describe('isGroupAdmin', () => {
    it('should return true for admin role', () => {
      const adminMember = { ...mockMember, role: 'admin' };
      const result = groupUtils.isGroupAdmin(adminMember);
      expect(result).toBe(true);
    });

    it('should return false for member role', () => {
      const result = groupUtils.isGroupAdmin(mockMember);
      expect(result).toBe(false);
    });
  });

  describe('getMemberCountText', () => {
    it('should return singular form for 1 member', () => {
      const result = groupUtils.getMemberCountText(1);
      expect(result).toBe('1 member');
    });

    it('should return plural form for multiple members', () => {
      const result = groupUtils.getMemberCountText(5);
      expect(result).toBe('5 members');
    });

    it('should handle zero members', () => {
      const result = groupUtils.getMemberCountText(0);
      expect(result).toBe('0 members');
    });
  });

  describe('formatEventDateTime', () => {
    it('should format valid date string correctly', () => {
      const result = groupUtils.formatEventDateTime('2023-12-01T10:00:00Z');
      expect(result).toMatch(/Dec 1, 2023/);
      expect(result).toMatch(/AM|PM/); // Should contain AM or PM
    });

    it('should return Invalid Date for invalid date string', () => {
      const result = groupUtils.formatEventDateTime('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('isEventUpcoming', () => {
    it('should return true for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const result = groupUtils.isEventUpcoming(futureDate.toISOString());
      expect(result).toBe(true);
    });

    it('should return false for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const result = groupUtils.isEventUpcoming(pastDate.toISOString());
      expect(result).toBe(false);
    });

    it('should return false for invalid date string', () => {
      const result = groupUtils.isEventUpcoming('invalid-date');
      expect(result).toBe(false);
    });
  });

  describe('getGroupAvatar', () => {
    it('should return avatar when available', () => {
      const groupWithAvatar = { ...mockGroup, avatar: 'avatar.jpg' };
      const result = groupUtils.getGroupAvatar(groupWithAvatar);
      expect(result).toBe('avatar.jpg');
    });

    it('should return emoji when no avatar is available', () => {
      const result = groupUtils.getGroupAvatar(mockGroup);
      expect(typeof result).toBe('string');
      expect(result?.length).toBeGreaterThan(0); // Emoji should be at least one character
    });

    it('should return consistent emoji for same title', () => {
      const result1 = groupUtils.getGroupAvatar(mockGroup);
      const result2 = groupUtils.getGroupAvatar(mockGroup);
      expect(result1).toBe(result2);
    });
  });

  describe('canEditPost', () => {
    it('should return true for post author', () => {
      const result = groupUtils.canEditPost(mockPost, 1, false);
      expect(result).toBe(true);
    });

    it('should return true for group admin', () => {
      const result = groupUtils.canEditPost(mockPost, 2, true);
      expect(result).toBe(true);
    });

    it('should return false for non-author non-admin', () => {
      const result = groupUtils.canEditPost(mockPost, 2, false);
      expect(result).toBe(false);
    });
  });

  describe('canEditEvent', () => {
    it('should return true for event creator', () => {
      const result = groupUtils.canEditEvent(mockEvent, 1, false);
      expect(result).toBe(true);
    });

    it('should return true for group admin', () => {
      const result = groupUtils.canEditEvent(mockEvent, 2, true);
      expect(result).toBe(true);
    });

    it('should return false for non-creator non-admin', () => {
      const result = groupUtils.canEditEvent(mockEvent, 2, false);
      expect(result).toBe(false);
    });
  });

  describe('getPostAuthorName', () => {
    it('should return author nickname when available', () => {
      const result = groupUtils.getPostAuthorName(mockPost);
      expect(result).toBe('testuser');
    });

    it('should return fallback when nickname is not available', () => {
      const postWithoutNickname = { ...mockPost, author_nickname: '' };
      const result = groupUtils.getPostAuthorName(postWithoutNickname);
      expect(result).toBe('Group Member');
    });
  });

  describe('getEventCreatorName', () => {
    it('should return creator nickname when available', () => {
      const result = groupUtils.getEventCreatorName(mockEvent);
      expect(result).toBe('testuser');
    });

    it('should return fallback when nickname is not available', () => {
      const eventWithoutNickname = { ...mockEvent, creator_nickname: '' };
      const result = groupUtils.getEventCreatorName(eventWithoutNickname);
      expect(result).toBe('Group Member');
    });
  });

  describe('sortGroupMembers', () => {
    it('should sort members with admins first', () => {
      const members: GroupMemberWithUser[] = [
        { ...mockMember, id: 1, role: 'member', created_at: '2023-01-01T00:00:00Z' },
        { ...mockMember, id: 2, role: 'admin', created_at: '2023-01-02T00:00:00Z' },
        { ...mockMember, id: 3, role: 'member', created_at: '2023-01-03T00:00:00Z' },
      ];

      const result = groupUtils.sortGroupMembers(members);
      
      expect(result[0].role).toBe('admin');
      expect(result[1].role).toBe('member');
      expect(result[2].role).toBe('member');
    });

    it('should sort members by join date when roles are the same', () => {
      const members: GroupMemberWithUser[] = [
        { ...mockMember, id: 1, role: 'member', created_at: '2023-01-03T00:00:00Z' },
        { ...mockMember, id: 2, role: 'member', created_at: '2023-01-01T00:00:00Z' },
        { ...mockMember, id: 3, role: 'member', created_at: '2023-01-02T00:00:00Z' },
      ];

      const result = groupUtils.sortGroupMembers(members);
      
      expect(result[0].id).toBe(2); // Earliest join date
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(1); // Latest join date
    });
  });

  describe('getGroupGradientColors', () => {
    it('should return consistent colors for same title', () => {
      const result1 = groupUtils.getGroupGradientColors('Test Group');
      const result2 = groupUtils.getGroupGradientColors('Test Group');
      expect(result1).toBe(result2);
    });

    it('should return different colors for different titles', () => {
      const result1 = groupUtils.getGroupGradientColors('A Group');
      const result2 = groupUtils.getGroupGradientColors('Z Group');
      expect(result1).not.toBe(result2);
    });

    it('should return valid gradient class', () => {
      const result = groupUtils.getGroupGradientColors('Test Group');
      expect(result).toMatch(/^from-\w+-\d+ to-\w+-\d+$/);
    });
  });
});
