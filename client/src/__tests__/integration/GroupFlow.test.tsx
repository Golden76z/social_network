import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import GroupsPage from '@/app/(pages)/(protected)/groups/page';
import GroupDetailPage from '@/app/(pages)/(protected)/groups/[id]/info/page';
import { useAuth } from '@/context/AuthProvider';
import { groupApi } from '@/lib/api/group';
import { GroupResponse } from '@/lib/types/group';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the auth context
jest.mock('@/context/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock the group API
jest.mock('@/lib/api/group', () => ({
  groupApi: {
    getAllGroups: jest.fn(),
    getUserGroups: jest.fn(),
    getUserPendingRequests: jest.fn(),
    getGroupById: jest.fn(),
    getGroupMembers: jest.fn(),
    getGroupPosts: jest.fn(),
    getGroupEvents: jest.fn(),
    getEventRSVPs: jest.fn(),
    createGroupRequest: jest.fn(),
    createGroupPost: jest.fn(),
    createGroupEvent: jest.fn(),
    rsvpToEvent: jest.fn(),
    removeGroupMember: jest.fn(),
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

const mockGroups: GroupResponse[] = [
  {
    id: 1,
    title: 'Test Group 1',
    bio: 'This is test group 1',
    avatar: '',
    creator_id: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Test Group 2',
    bio: 'This is test group 2',
    avatar: '',
    creator_id: 2,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

describe('Group Flow Integration Tests', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  describe('Complete Group Join Flow', () => {
    it('should allow user to browse groups, join a group, and view group details', async () => {
      // Mock API responses
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue([]);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue({ requests: [] });
      (groupApi.createGroupRequest as jest.Mock).mockResolvedValue({ success: true });

      // Render groups page
      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });

      // Switch to All Groups tab
      const allGroupsTab = screen.getByText('All Groups');
      fireEvent.click(allGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
        expect(screen.getByText('Test Group 2')).toBeInTheDocument();
      });

      // Click View Details on first group
      const viewDetailsButtons = screen.getAllByText('View Details');
      fireEvent.click(viewDetailsButtons[0]);

      // Should navigate to group detail page
      expect(mockPush).toHaveBeenCalledWith('/groups/1/info');
    });

    it('should handle join request and show success modal', async () => {
      // Mock API responses for groups page
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue([]);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue({ requests: [] });
      (groupApi.createGroupRequest as jest.Mock).mockResolvedValue({ success: true });

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });

      // Switch to All Groups tab
      const allGroupsTab = screen.getByText('All Groups');
      fireEvent.click(allGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      });

      // Click Join Group button
      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      // Should show success modal
      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      });

      // Close modal
      const gotItButton = screen.getByText('Got it');
      fireEvent.click(gotItButton);

      await waitFor(() => {
        expect(screen.queryByText('Join Request Sent')).not.toBeInTheDocument();
      });
    });
  });

  describe('Group Detail Page Integration', () => {
    const mockGroupDetail = {
      id: 1,
      title: 'Test Group',
      bio: 'This is a test group',
      avatar: '',
      creator_id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const mockMembers = [
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

    const mockPosts = [
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

    const mockEvents = [
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

    beforeEach(() => {
      (useParams as jest.Mock).mockReturnValue({ id: '1' });
    });

    it('should display group information and allow navigation between tabs', async () => {
      // Mock API responses
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroupDetail);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue(mockPosts);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue(mockEvents);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });

      // Should display group information
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.getByText('This is a test group')).toBeInTheDocument();
      expect(screen.getByText('2 members')).toBeInTheDocument();

      // Should display group stats
      expect(screen.getByText('1 posts')).toBeInTheDocument();
      expect(screen.getByText('1 events')).toBeInTheDocument();

      // Should show Info tab content by default
      expect(screen.getByText('admin_user')).toBeInTheDocument();
      expect(screen.getByText('member_user')).toBeInTheDocument();

      // Switch to Posts tab
      const postsTab = screen.getByText('Posts');
      fireEvent.click(postsTab);

      await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeInTheDocument();
        expect(screen.getByText('Test Post')).toBeInTheDocument();
      });

      // Switch to Events tab
      const eventsTab = screen.getByText('Events');
      fireEvent.click(eventsTab);

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByText('by admin_user')).toBeInTheDocument();
      });
    });

    it('should handle group join request from detail page', async () => {
      // Mock API responses
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroupDetail);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);
      (groupApi.createGroupRequest as jest.Mock).mockResolvedValue({ success: true });

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });

      // Should show Request Join button
      expect(screen.getByText('Request Join')).toBeInTheDocument();

      // Click Request Join button
      const joinButton = screen.getByText('Request Join');
      fireEvent.click(joinButton);

      // Should show success modal
      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });
    });

    it('should handle post creation flow', async () => {
      // Make user a member
      const memberUser = { ...mockUser, id: 2 };
      (useAuth as jest.Mock).mockReturnValue({ user: memberUser });

      // Mock API responses
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroupDetail);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);
      (groupApi.createGroupPost as jest.Mock).mockResolvedValue({ id: 2, success: true });

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });

      // Switch to Posts tab
      const postsTab = screen.getByText('Posts');
      fireEvent.click(postsTab);

      // Click Create Post button
      const createButton = screen.getByText('Create Post');
      fireEvent.click(createButton);

      // Should show create post modal
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

    it('should handle event creation flow', async () => {
      // Make user a member
      const memberUser = { ...mockUser, id: 2 };
      (useAuth as jest.Mock).mockReturnValue({ user: memberUser });

      // Mock API responses
      (groupApi.getGroupById as jest.Mock).mockResolvedValue(mockGroupDetail);
      (groupApi.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);
      (groupApi.getGroupPosts as jest.Mock).mockResolvedValue([]);
      (groupApi.getGroupEvents as jest.Mock).mockResolvedValue([]);
      (groupApi.getEventRSVPs as jest.Mock).mockResolvedValue([]);
      (groupApi.createGroupEvent as jest.Mock).mockResolvedValue({ id: 2, success: true });

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading group...')).not.toBeInTheDocument();
      });

      // Switch to Events tab
      const eventsTab = screen.getByText('Events');
      fireEvent.click(eventsTab);

      // Click Create Event button
      const createButton = screen.getByText('Create Event');
      fireEvent.click(createButton);

      // Should show create event modal
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

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully throughout the flow', async () => {
      // Mock API to return errors
      (groupApi.getAllGroups as jest.Mock).mockRejectedValue(new Error('Network error'));
      (groupApi.getUserGroups as jest.Mock).mockRejectedValue(new Error('Network error'));
      (groupApi.getUserPendingRequests as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading groups')).toBeInTheDocument();
      });

      // Should show retry button
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue([]);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue({ requests: [] });

      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      });
    });

    it('should handle group detail page errors', async () => {
      (useParams as jest.Mock).mockReturnValue({ id: '1' });

      // Mock API to return error
      (groupApi.getGroupById as jest.Mock).mockRejectedValue(new Error('Group not found'));

      render(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading group')).toBeInTheDocument();
      });

      // Should show retry button
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate between pages correctly', async () => {
      // Mock API responses for groups page
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue([]);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue({ requests: [] });

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });

      // Switch to All Groups tab
      const allGroupsTab = screen.getByText('All Groups');
      fireEvent.click(allGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      });

      // Click View Details
      const viewDetailsButtons = screen.getAllByText('View Details');
      fireEvent.click(viewDetailsButtons[0]);

      // Should navigate to group detail page
      expect(mockPush).toHaveBeenCalledWith('/groups/1/info');
    });
  });
});
