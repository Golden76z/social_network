import { groupApi } from '@/lib/api/group';
import { ApiClient } from '@/lib/api';

// Mock the ApiClient
jest.mock('@/lib/api', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('groupApi', () => {
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock ApiClient instance
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Mock the ApiClient constructor to return our mock
    (ApiClient as jest.Mock).mockImplementation(() => mockApiClient);
  });

  describe('getAllGroups', () => {
    it('should fetch all groups', async () => {
      const mockGroups = [
        { id: 1, title: 'Group 1', bio: 'Bio 1' },
        { id: 2, title: 'Group 2', bio: 'Bio 2' },
      ];
      
      mockApiClient.get.mockResolvedValue(mockGroups);

      const result = await groupApi.getAllGroups();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/group');
      expect(result).toEqual(mockGroups);
    });

    it('should handle errors when fetching groups', async () => {
      const errorMessage = 'Failed to fetch groups';
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(groupApi.getAllGroups()).rejects.toThrow(errorMessage);
    });
  });

  describe('getUserGroups', () => {
    it('should fetch user groups', async () => {
      const mockUserGroups = [
        { id: 1, title: 'My Group 1', bio: 'Bio 1' },
        { id: 2, title: 'My Group 2', bio: 'Bio 2' },
      ];
      
      mockApiClient.get.mockResolvedValue(mockUserGroups);

      const result = await groupApi.getUserGroups();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/group/user');
      expect(result).toEqual(mockUserGroups);
    });
  });

  describe('getGroupById', () => {
    it('should fetch a group by ID', async () => {
      const groupId = 1;
      const mockGroup = { id: groupId, title: 'Test Group', bio: 'Test Bio' };
      
      mockApiClient.get.mockResolvedValue(mockGroup);

      const result = await groupApi.getGroupById(groupId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/group?id=${groupId}`);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('createGroup', () => {
    it('should create a new group', async () => {
      const groupData = {
        title: 'New Group',
        avatar: 'avatar.jpg',
        bio: 'New group bio',
      };
      const mockResponse = { id: 1, ...groupData };
      
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await groupApi.createGroup(groupData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/group', groupData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createGroupRequest', () => {
    it('should create a group join request', async () => {
      const groupId = 1;
      const mockResponse = { success: true, message: 'Request sent' };
      
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await groupApi.createGroupRequest(groupId);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/group/request', { group_id: groupId });
      expect(result).toEqual(mockResponse);
    });

    it('should handle duplicate request error gracefully', async () => {
      const groupId = 1;
      const mockResponse = { success: true, message: 'Request already exists', duplicate: true };
      
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await groupApi.createGroupRequest(groupId);

      expect(result).toEqual(mockResponse);
      expect(result.duplicate).toBe(true);
    });
  });

  describe('getUserPendingRequests', () => {
    it('should fetch user pending requests', async () => {
      const mockRequests = {
        requests: [
          { id: 1, group_id: 1, status: 'pending' },
          { id: 2, group_id: 2, status: 'pending' },
        ],
      };
      
      mockApiClient.get.mockResolvedValue(mockRequests);

      const result = await groupApi.getUserPendingRequests();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/group/request');
      expect(result).toEqual(mockRequests);
    });
  });

  describe('getGroupMembers', () => {
    it('should fetch group members', async () => {
      const groupId = 1;
      const mockMembers = [
        { id: 1, user_id: 1, role: 'admin', nickname: 'Admin User' },
        { id: 2, user_id: 2, role: 'member', nickname: 'Member User' },
      ];
      
      mockApiClient.get.mockResolvedValue(mockMembers);

      const result = await groupApi.getGroupMembers(groupId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/group/member?groupId=${groupId}`);
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getGroupPosts', () => {
    it('should fetch group posts', async () => {
      const groupId = 1;
      const offset = 0;
      const mockPosts = [
        {
          id: 1,
          user_id: 1,
          title: 'Test Post',
          body: 'Test content',
          author_nickname: 'Test User',
        },
      ];
      
      mockApiClient.get.mockResolvedValue(mockPosts);

      const result = await groupApi.getGroupPosts(groupId, offset);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/group/post?groupId=${groupId}&offset=${offset}`);
      expect(result).toEqual(mockPosts);
    });
  });

  describe('getGroupEvents', () => {
    it('should fetch group events', async () => {
      const groupId = 1;
      const mockEvents = [
        {
          id: 1,
          title: 'Test Event',
          description: 'Test description',
          event_datetime: '2023-12-01T10:00:00Z',
          creator_nickname: 'Test User',
        },
      ];
      
      mockApiClient.get.mockResolvedValue(mockEvents);

      const result = await groupApi.getGroupEvents(groupId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/group/event?groupId=${groupId}`);
      expect(result).toEqual(mockEvents);
    });
  });

  describe('createGroupPost', () => {
    it('should create a new group post', async () => {
      const postData = {
        group_id: 1,
        title: 'New Post',
        body: 'New post content',
      };
      const mockResponse = { id: 1, ...postData };
      
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await groupApi.createGroupPost(postData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/group/post', postData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createGroupEvent', () => {
    it('should create a new group event', async () => {
      const eventData = {
        group_id: 1,
        title: 'New Event',
        description: 'New event description',
        event_date_time: '2023-12-01T10:00:00Z',
      };
      const mockResponse = { id: 1, ...eventData };
      
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await groupApi.createGroupEvent(eventData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/group/event', eventData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rsvpToEvent', () => {
    it('should RSVP to an event', async () => {
      const rsvpData = {
        event_id: 1,
        status: 'come',
      };
      const mockResponse = { success: true, message: 'RSVP recorded' };
      
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await groupApi.rsvpToEvent(rsvpData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/event/rsvp', rsvpData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('removeGroupMember', () => {
    it('should remove a group member', async () => {
      const groupId = 1;
      const userId = 2;
      const mockResponse = { success: true, message: 'Member removed' };
      
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const result = await groupApi.removeGroupMember(groupId, userId);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/group/member', {
        body: JSON.stringify({
          group_id: Number(groupId),
          user_id: Number(userId),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
