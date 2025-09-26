import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupCard } from '@/components/groups/GroupCard';
import { GroupResponse } from '@/lib/types/group';
import { useAuth } from '@/context/AuthProvider';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the group API
jest.mock('@/lib/api/group', () => ({
  groupApi: {
    createGroupRequest: jest.fn(),
    leaveGroup: jest.fn(),
  },
}));

// Mock the auth context
jest.mock('@/context/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const mockGroup: GroupResponse = {
  id: 1,
  title: 'Test Group',
  bio: 'This is a test group for testing purposes',
  avatar: '',
  creator_id: 1,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockUser = {
  id: 1,
  nickname: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  avatar: '',
  created_at: '2023-01-01T00:00:00Z',
};

describe('GroupCard', () => {
  const mockOnJoin = jest.fn();
  const mockOnLeave = jest.fn();
  const mockOnView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  describe('Basic Rendering', () => {
    it('should render group information correctly', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={10}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.getByText('This is a test group for testing purposes')).toBeInTheDocument();
      expect(screen.getByText('10 members')).toBeInTheDocument();
    });

    it('should show group avatar when provided', () => {
      const groupWithAvatar = {
        ...mockGroup,
        avatar: 'https://example.com/avatar.jpg',
      };

      render(
        <GroupCard
          group={groupWithAvatar}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const avatarImage = screen.getByAltText('Test Group');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should show default emoji when no avatar is provided', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      // Should show emoji instead of image
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Join Functionality', () => {
    it('should show Join Group button when user is not a member', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      expect(screen.getByText('Join Group')).toBeInTheDocument();
    });

    it('should call onJoin when Join Group button is clicked', async () => {
      const { groupApi } = require('@/lib/api/group');
      groupApi.createGroupRequest.mockResolvedValue({ success: true });

      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(groupApi.createGroupRequest).toHaveBeenCalledWith(mockGroup.id);
        expect(mockOnJoin).toHaveBeenCalledWith(mockGroup.id);
      });
    });

    it('should show loading state during join request', async () => {
      const { groupApi } = require('@/lib/api/group');
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      groupApi.createGroupRequest.mockReturnValue(promise);

      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      // Button should be disabled during loading
      await waitFor(() => {
        expect(joinButton).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise!({ success: true });
      await waitFor(() => {
        expect(joinButton).not.toBeDisabled();
      });
    });

    it('should show error alert when join request fails', async () => {
      const { groupApi } = require('@/lib/api/group');
      const errorMessage = 'Failed to send join request';
      groupApi.createGroupRequest.mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(errorMessage);
      });

      mockAlert.mockRestore();
    });
  });

  describe('Leave Functionality', () => {
    it('should show Leave Group button when user is a member', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={true}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      expect(screen.getByText('Leave Group')).toBeInTheDocument();
    });

    it('should call onLeave when Leave Group button is clicked', async () => {
      const { groupApi } = require('@/lib/api/group');
      groupApi.leaveGroup.mockResolvedValue({ success: true });

      render(
        <GroupCard
          group={mockGroup}
          isMember={true}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const leaveButton = screen.getByText('Leave Group');
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(groupApi.leaveGroup).toHaveBeenCalledWith({
          group_id: mockGroup.id,
          user_id: mockUser.id,
        });
        expect(mockOnLeave).toHaveBeenCalledWith(mockGroup.id);
      });
    });
  });

  describe('Pending Request State', () => {
    it('should show Request Sent button when user has pending request', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={true}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      expect(screen.getByText('Request Sent')).toBeInTheDocument();
      expect(screen.queryByText('Join Group')).not.toBeInTheDocument();
    });

    it('should disable join button when user has pending request', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={true}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const requestSentButton = screen.getByText('Request Sent');
      expect(requestSentButton).toBeDisabled();
    });
  });

  describe('View Functionality', () => {
    it('should call onView when View Details button is clicked', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(mockOnView).toHaveBeenCalledWith(mockGroup.id);
    });
  });

  describe('Member Count Display', () => {
    it('should show correct member count', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={42}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      expect(screen.getByText('42 members')).toBeInTheDocument();
    });

    it('should show singular form for 1 member', () => {
      render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={1}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      expect(screen.getByText('1 member')).toBeInTheDocument();
    });
  });

  describe('Gradient Colors', () => {
    it('should generate consistent gradient colors for the same title', () => {
      const { rerender } = render(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const firstGradient = screen.getByText('Test Group').closest('.bg-gradient-to-r');
      const gradientClasses1 = firstGradient?.className;

      rerender(
        <GroupCard
          group={mockGroup}
          isMember={false}
          memberCount={5}
          hasPendingRequest={false}
          onJoin={mockOnJoin}
          onLeave={mockOnLeave}
          onView={mockOnView}
        />
      );

      const secondGradient = screen.getByText('Test Group').closest('.bg-gradient-to-r');
      const gradientClasses2 = secondGradient?.className;

      expect(gradientClasses1).toBe(gradientClasses2);
    });
  });
});
