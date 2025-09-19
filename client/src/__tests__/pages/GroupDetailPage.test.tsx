import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import GroupDetailPage from '@/app/(pages)/(protected)/groups/[id]/info/page';
import { useAuth } from '@/context/AuthProvider';
import { groupApi } from '@/lib/api/group';
import { reactionApi } from '@/lib/api/reaction';
import { GroupResponse, GroupMemberWithUser, GroupPost, GroupEvent } from '@/lib/types/group';

// Mock Next.js router and params
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock the auth context
jest.mock('@/context/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock the APIs
jest.mock('@/lib/api/group', () => ({
  groupApi: {
    getGroupById: jest.fn(),
    getGroupMembers: jest.fn(),
    getGroupPosts: jest.fn(),
    getGroupEvents: jest.fn(),
    getEventRSVPs: jest.fn(),
    createGroupRequest: jest.fn(),
    createGroupPost: jest.fn(),
    createGroupEvent: jest.fn(),
    updateGroupPost: jest.fn(),
    deleteGroupPost: jest.fn(),
    updateGroupEvent: jest.fn(),
    deleteGroupEvent: jest.fn(),
    removeGroupMember: jest.fn(),
    getGroupComments: jest.fn(),
    createGroupComment: jest.fn(),
  },
}));

jest.mock('@/lib/api/reaction', () => ({
  reactionApi: {
    createReaction: jest.fn(),
    deleteReaction: jest.fn(),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock PostCard and PostModal components
jest.mock('@/components/PostCard', () => {
  return function MockPostCard({ post, onLike, onComment, onViewDetails }: any) {
    return (
      <div data-testid={`post-${post.id}`}>
        <h3>{post.title}</h3>
        <p>{post.body}</p>
        <button onClick={() => onLike(post.id)}>Like</button>
        <button onClick={() => onComment(post.id)}>Comment</button>
        <button onClick={() => onViewDetails(post.id)}>View Details</button>
      </div>
    );
  };
});

jest.mock('@/components/PostModal', () => {
  return function MockPostModal({ post, isOpen, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="post-modal">
        <h2>{post.title}</h2>
        <p>{post.body}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const mockUser = {
  id: 1,
  nickname: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  avatar: '',
  created_at: '2023-01-01T00:00:00Z',
};

const mockGroup: GroupResponse = {
  id: 1,
  title: 'Test Group',
  bio: 'This is a test group',
  avatar: '',
  creator_id: 1,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockMembers: GroupMemberWithUser[] = [
  {
    id: 1,
    group_id: 1,
    user_id: 1,
    role: 'admin',
    invited_by: null,
    created_at: '2023-01-01T00:00:00Z',
    nickname: 'admin_user',
    first_name: 'Admin',
    last_name: 'User',
    avatar: '',
  },
  {
    id: 2,
    group_id: 1,
    user_id: 2,
    role: 'member',
    invited_by: 1,
    created_at: '2023-01-02T00:00:00Z',
    nickname: 'member_user',
    first_name: 'Member',
    last_name: 'User',
    avatar: '',
  },
];

const mockPosts: GroupPost[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Test Post',
    body: 'This is a test post',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    visibility: 'public',
    images: [],
    likes: 5,
    dislikes: 1,
    user_liked: false,
    user_disliked: false,
    author_nickname: 'admin_user',
  },
];

const mockEvents: GroupEvent[] = [
  {
    id: 1,
    group_id: 1,
    creator_id: 1,
    title: 'Test Event',
    description: 'This is a test event',
    event_datetime: '2023-12-01T10:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    creator_nickname: 'admin_user',
  },
];

describe('GroupDetailPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      // Mock API calls to return promises that never resolve
      (groupApi.getGroupById as jest.Mock).mockReturnValue(new Promise(() => {}));
      (groupApi.getGroupMembers as jest.Mock).mockReturnValue(new Promise(() => {}));

      render(<GroupDetailPage />);

      expect(screen.getByText('Loading group...')).toBeInTheDocument();
    });
  });

  describe('Group Information Display', () => {
    beforeEach(async () => {
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue(mockPosts);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue(mockEvents);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });
    });

    it('should display group information correctly', () => {
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.getByText('This is a test group')).toBeInTheDocument();
      expect(screen.getByText('2 members')).toBeInTheDocument();
    });

    it('should show group stats', () => {
      expect(screen.getByText('1 posts')).toBeInTheDocument();
      expect(screen.getByText('1 events')).toBeInTheDocument();
    });

    it('should display group members', () => {
      expect(screen.getByText('admin_user')).toBeInTheDocument();
      expect(screen.getByText('member_user')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
  });

  describe('Join Group Functionality', () => {
    beforeEach(async () => {
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);
      (groupApi.createGroupRequest as jest.Mock).mockResolvedValue({ success: true });

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });
    });

    it('should show Request Join button when user is not a member', () => {
      expect(screen.getByText('Request Join')).toBeInTheDocument();
    });

    it('should handle join request successfully', async () => {
      const joinButton = screen.getByText('Request Join');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(groupApi.createGroupRequest).toHaveBeenCalledWith(1);
      });

      // Should show success modal
      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
      });
    });

    it('should handle duplicate join request gracefully', async () => {
      (groupApi.createGroupRequest as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Request already exists',
        duplicate: true,
      });

      const joinButton = screen.getByText('Request Join');
      fireEvent.click(joinButton);

      // Should show success modal even for duplicate requests
      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue(mockPosts);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue(mockEvents);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });
    });

    it('should switch between tabs correctly', () => {
      // Default should be Info tab
      expect(screen.getByText('admin_user')).toBeInTheDocument();

      // Switch to Posts tab
      const postsTab = screen.getByText('Posts');
      fireEvent.click(postsTab);
      expect(screen.getByTestId('post-1')).toBeInTheDocument();

      // Switch to Events tab
      const eventsTab = screen.getByText('Events');
      fireEvent.click(eventsTab);
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });
  });

  describe('Post Functionality', () => {
    beforeEach(async () => {
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue(mockPosts);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });

      // Switch to Posts tab
      const postsTab = screen.getByText('Posts');
      fireEvent.click(postsTab);
    });

    it('should display group posts', () => {
      expect(screen.getByTestId('post-1')).toBeInTheDocument();
      expect(screen.getByText('Test Post')).toBeInTheDocument();
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });

    it('should show Create Post button for members', () => {
      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    it('should handle post creation', async () => {
      (groupApi.createGroupPost as jest.Mock).mockResolvedValue({ id: 2, success: true });

      const createButton = screen.getByText('Create Post');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create Post')).toBeInTheDocument(); // Modal title
      });

      // Fill form and submit
      const titleInput = screen.getByLabelText('Title');
      const bodyInput = screen.getByLabelText('Content');
      const submitButton = screen.getByText('Create Post');

      fireEvent.change(titleInput, { target: { value: 'New Post' } });
      fireEvent.change(bodyInput, { target: { value: 'New post content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(groupApi.createGroupPost).toHaveBeenCalledWith({
          group_id: 1,
          title: 'New Post',
          body: 'New post content',
        });
      });
    });

    it('should handle post like functionality', async () => {
      (reactionApi.createReaction as jest.Mock).mockResolvedValue({ response: 'success' });

      const likeButton = screen.getByText('Like');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(reactionApi.createReaction).toHaveBeenCalledWith({
          group_post_id: 1,
          type: 'like',
        });
      });
    });

    it('should open post modal when View Details is clicked', async () => {
      const viewDetailsButton = screen.getByText('View Details');
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('post-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Event Functionality', () => {
    beforeEach(async () => {
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue(mockEvents);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });

      // Switch to Events tab
      const eventsTab = screen.getByText('Events');
      fireEvent.click(eventsTab);
    });

    it('should display group events', () => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('This is a test event')).toBeInTheDocument();
      expect(screen.getByText('by admin_user')).toBeInTheDocument();
    });

    it('should show Create Event button for members', () => {
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });

    it('should handle event creation', async () => {
      (groupApi.createGroupEvent as jest.Mock).mockResolvedValue({ id: 2, success: true });

      const createButton = screen.getByText('Create Event');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create Event')).toBeInTheDocument(); // Modal title
      });

      // Fill form and submit
      const titleInput = screen.getByLabelText('Title');
      const descriptionInput = screen.getByLabelText('Description');
      const dateInput = screen.getByLabelText('Date');
      const timeInput = screen.getByLabelText('Time');
      const submitButton = screen.getByText('Create Event');

      fireEvent.change(titleInput, { target: { value: 'New Event' } });
      fireEvent.change(descriptionInput, { target: { value: 'New event description' } });
      fireEvent.change(dateInput, { target: { value: '2023-12-01' } });
      fireEvent.change(timeInput, { target: { value: '10:00' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(groupApi.createGroupEvent).toHaveBeenCalledWith({
          group_id: 1,
          title: 'New Event',
          description: 'New event description',
          event_date_time: '2023-12-01 10:00:00',
        });
      });
    });
  });

  describe('Member Management', () => {
    beforeEach(async () => {
      // Make user an admin
      const adminUser = { ...mockUser, id: 1 };
      (useAuth as jest.Mock).mockReturnValue({ user: adminUser });

      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);
      (groupApi.removeGroupMember as jest.Mock).mockResolvedValue({ success: true });

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });
    });

    it('should show remove button for non-admin members when user is admin', () => {
      // Should show remove button for member_user (non-admin)
      const removeButtons = screen.getAllByTitle('Remove member');
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should handle member removal', async () => {
      const removeButton = screen.getAllByTitle('Remove member')[0];
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText('Remove Member')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Remove');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(groupApi.removeGroupMember).toHaveBeenCalledWith(1, 2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when group loading fails', async () => {
      const errorMessage = 'Failed to load group';
      (groupApi.getGroupById as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading group')).toBeInTheDocument();
      });
    });

    it('should allow retry when error occurs', async () => {
      const errorMessage = 'Failed to load group';
      (groupApi.getGroupById as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading group')).toBeInTheDocument();
      });

      // Mock successful retry
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroup);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);
      (groupApi.createGroupRequest as jest.Mock).mockResolvedValue({ success: true });

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });

      // Trigger join request to show modal
      const joinButton = screen.getByText('Request Join');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
      });
    });

    it('should close modal when escape key is pressed', async () => {
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Join Request Sent')).not.toBeInTheDocument();
      });
    });
  });
});
