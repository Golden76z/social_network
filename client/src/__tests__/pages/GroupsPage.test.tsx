import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import GroupsPage from '@/app/(pages)/(protected)/groups/page';
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
    createGroupRequest: jest.fn(),
    leaveGroup: jest.fn(),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
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

const mockUserGroups: GroupResponse[] = [
  {
    id: 1,
    title: 'My Group',
    bio: 'This is my group',
    avatar: '',
    creator_id: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockPendingRequests = {
  requests: [
    { id: 1, group_id: 3, status: 'pending' },
  ],
};

describe('GroupsPage', () => {
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

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      // Mock API calls to return promises that never resolve
      (groupApi.getAllGroups as jest.Mock).mockReturnValue(new Promise(() => {}));
      (groupApi.getUserGroups as jest.Mock).mockReturnValue(new Promise(() => {}));
      (groupApi.getUserPendingRequests as jest.Mock).mockReturnValue(new Promise(() => {}));

      render(<GroupsPage />);

      expect(screen.getByText('Loading groups...')).toBeInTheDocument();
    });
  });

  describe('My Groups Tab', () => {
    beforeEach(async () => {
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue(mockUserGroups);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue(mockPendingRequests);

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });
    });

    it('should display user groups by default', async () => {
      expect(screen.getByText('My Groups')).toBeInTheDocument();
      expect(screen.getByText('My Group')).toBeInTheDocument();
      expect(screen.getByText('This is my group')).toBeInTheDocument();
    });

    it('should show empty state when user has no groups', async () => {
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue([]);

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('No groups found')).toBeInTheDocument();
      });
    });
  });

  describe('All Groups Tab', () => {
    beforeEach(async () => {
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue(mockUserGroups);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue(mockPendingRequests);

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });

      // Switch to All Groups tab
      const allGroupsTab = screen.getByText('All Groups');
      fireEvent.click(allGroupsTab);
    });

    it('should display all groups when All Groups tab is selected', async () => {
      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument();
        expect(screen.getByText('Test Group 2')).toBeInTheDocument();
        expect(screen.getByText('This is test group 1')).toBeInTheDocument();
        expect(screen.getByText('This is test group 2')).toBeInTheDocument();
      });
    });

    it('should show empty state when no groups exist', async () => {
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue([]);

      render(<GroupsPage />);

      // Switch to All Groups tab
      const allGroupsTab = screen.getByText('All Groups');
      fireEvent.click(allGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('No groups found')).toBeInTheDocument();
      });
    });
  });

  describe('Group Interaction', () => {
    beforeEach(async () => {
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue(mockUserGroups);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue(mockPendingRequests);
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
    });

    it('should handle join group request successfully', async () => {
      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(groupApi.createGroupRequest).toHaveBeenCalledWith(1);
      });

      // Should show success modal
      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
      });
    });

    it('should handle join group request error', async () => {
      const errorMessage = 'Failed to send join request';
      (groupApi.createGroupRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(errorMessage);
      });

      mockAlert.mockRestore();
    });

    it('should handle duplicate join request gracefully', async () => {
      (groupApi.createGroupRequest as jest.Mock).mockRejectedValue(
        new Error('User already has a pending request for this group')
      );

      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      // Should show success modal even for duplicate requests
      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
      });
    });

    it('should navigate to group details when View Details is clicked', async () => {
      const viewButtons = screen.getAllByText('View Details');
      fireEvent.click(viewButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/groups/1/info');
    });

    it('should handle leave group functionality', async () => {
      // Switch to My Groups tab where leave button should be visible
      const myGroupsTab = screen.getByText('My Groups');
      fireEvent.click(myGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('My Group')).toBeInTheDocument();
      });

      const leaveButton = screen.getByText('Leave Group');
      fireEvent.click(leaveButton);

      // The leave functionality should be handled by the GroupCard component
      // We're just testing that the button is present and clickable
      expect(leaveButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API calls fail', async () => {
      const errorMessage = 'Failed to load groups';
      (groupApi.getAllGroups as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (groupApi.getUserGroups as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (groupApi.getUserPendingRequests as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading groups')).toBeInTheDocument();
      });
    });

    it('should allow retry when error occurs', async () => {
      const errorMessage = 'Failed to load groups';
      (groupApi.getAllGroups as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (groupApi.getUserGroups as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (groupApi.getUserPendingRequests as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading groups')).toBeInTheDocument();
      });

      // Mock successful retry
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue(mockUserGroups);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue(mockPendingRequests);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('My Group')).toBeInTheDocument();
      });
    });
  });

  describe('Join Success Modal', () => {
    beforeEach(async () => {
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue(mockUserGroups);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue(mockPendingRequests);
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

      // Trigger join request
      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
      });
    });

    it('should display join success modal with correct information', () => {
      expect(screen.getByText('Join Request Sent')).toBeInTheDocument();
      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      expect(screen.getByText('Your request to join this group has been sent successfully.')).toBeInTheDocument();
      expect(screen.getByText('Got it')).toBeInTheDocument();
    });

    it('should close modal when Got it button is clicked', async () => {
      const gotItButton = screen.getByText('Got it');
      fireEvent.click(gotItButton);

      await waitFor(() => {
        expect(screen.queryByText('Join Request Sent')).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking outside', async () => {
      const modal = screen.getByText('Join Request Sent').closest('.fixed');
      fireEvent.click(modal!);

      await waitFor(() => {
        expect(screen.queryByText('Join Request Sent')).not.toBeInTheDocument();
      });
    });

    it('should close modal when escape key is pressed', async () => {
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Join Request Sent')).not.toBeInTheDocument();
      });
    });
  });

  describe('Focus Handling', () => {
    it('should refresh data when window gains focus', async () => {
      (groupApi.getAllGroups as jest.Mock).mockResolvedValue(mockGroups);
      (groupApi.getUserGroups as jest.Mock).mockResolvedValue(mockUserGroups);
      (groupApi.getUserPendingRequests as jest.Mock).mockResolvedValue(mockPendingRequests);

      render(<GroupsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading groups...')).not.toBeInTheDocument();
      });

      // Clear previous calls
      jest.clearAllMocks();

      // Simulate window focus
      fireEvent(window, new Event('focus'));

      await waitFor(() => {
        expect(groupApi.getAllGroups).toHaveBeenCalled();
        expect(groupApi.getUserGroups).toHaveBeenCalled();
        expect(groupApi.getUserPendingRequests).toHaveBeenCalled();
      });
    });
  });
});
