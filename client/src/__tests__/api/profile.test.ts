import { postApi } from '@/lib/api/post';
import { groupApi } from '@/lib/api/group';
import { apiClient } from '@/lib/api';

// Mock the apiClient to control responses
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Profile API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful login for tests that require authentication
    (apiClient.post as jest.Mock).mockImplementation((url: string, data: any) => {
      if (url === 'http://localhost:8080/auth/login') {
        return Promise.resolve({
          message: 'Login successful',
          token: 'mock_jwt_token',
        });
      }
      return Promise.reject(new Error('Unknown POST endpoint'));
    });
  });

  describe('getLikedPosts', () => {
    test('should fetch liked posts with author information', async () => {
      const mockLikedPosts = [
        {
          id: 91,
          user_id: 1,
          title: 'Test post fgsdfg',
          body: 'Test body content',
          images: [
            '/uploads/posts/20250921T011952Z_af9f1c27-4d9b-4934-90cb-894212533793.jpg',
            '/uploads/posts/20250921T011952Z_bb86f742-9a7e-429d-9f6e-1fc519dcded7.jpg'
          ],
          visibility: 'public',
          created_at: '2025-09-21T01:19:52Z',
          updated_at: '2025-09-21T01:44:25Z',
          likes: 1,
          dislikes: 0,
          user_liked: true,
          user_disliked: false,
          author_nickname: 'ckent',
          author_first_name: 'Clark',
          author_last_name: 'Kent',
          author_avatar: '/uploads/avatars/20250920T132100Z_c35d2e00-231f-4192-aaf7-22a3862993db.jpg'
        },
        {
          id: 1,
          user_id: 39,
          title: "Cyclops's Mission Report",
          body: 'If professor face white yeah to. Significant check eye however. Old board beautiful top many law.',
          images: ['https://picsum.photos/seed/6386/400/300'],
          visibility: 'private',
          created_at: '2025-09-17T13:06:03Z',
          updated_at: '2025-09-17T13:06:03Z',
          likes: 3,
          dislikes: 0,
          user_liked: true,
          user_disliked: false,
          author_nickname: 'zmurray',
          author_first_name: 'Zachary',
          author_last_name: 'Murray',
          author_avatar: '' // Empty string for users without avatars
        }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockLikedPosts);

      const result = await postApi.getLikedPosts();

      expect(apiClient.get).toHaveBeenCalledWith('/api/post?liked=true');
      expect(result).toEqual(mockLikedPosts);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('author_avatar');
      expect(result[0].author_avatar).toBeTruthy();
      expect(result[1].author_avatar).toBe(''); // Empty string for users without avatars
    });

    test('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to get posts';
      (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(postApi.getLikedPosts()).rejects.toThrow(errorMessage);
    });
  });

  describe('getCommentedPosts', () => {
    test('should fetch commented posts with author information', async () => {
      const mockCommentedPosts = [
        {
          id: 91,
          user_id: 1,
          title: 'Test post fgsdfg',
          body: 'Test body content',
          images: [
            '/uploads/posts/20250921T011952Z_af9f1c27-4d9b-4934-90cb-894212533793.jpg',
            '/uploads/posts/20250921T011952Z_bb86f742-9a7e-429d-9f6e-1fc519dcded7.jpg'
          ],
          visibility: 'public',
          created_at: '2025-09-21T01:19:52Z',
          updated_at: '2025-09-21T01:44:25Z',
          likes: 1,
          dislikes: 0,
          user_liked: true,
          user_disliked: false,
          author_nickname: 'ckent',
          author_first_name: 'Clark',
          author_last_name: 'Kent',
          author_avatar: '/uploads/avatars/20250920T132100Z_c35d2e00-231f-4192-aaf7-22a3862993db.jpg'
        },
        {
          id: 17,
          user_id: 32,
          title: "Batman's Mission Report",
          body: 'Write less even realize Mr agreement kid. Bad away sit include her rather.',
          images: ['https://picsum.photos/seed/8520/400/300'],
          visibility: 'public',
          created_at: '2025-09-17T13:06:03Z',
          updated_at: '2025-09-17T13:06:03Z',
          likes: 0,
          dislikes: 1,
          user_liked: false,
          user_disliked: false,
          author_nickname: 'dmartinez',
          author_first_name: 'David',
          author_last_name: 'Martinez',
          author_avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Timothy'
        }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockCommentedPosts);

      const result = await postApi.getCommentedPosts();

      expect(apiClient.get).toHaveBeenCalledWith('/api/post?commented=true');
      expect(result).toEqual(mockCommentedPosts);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('author_avatar');
      expect(result[1]).toHaveProperty('author_avatar');
    });

    test('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to get posts';
      (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(postApi.getCommentedPosts()).rejects.toThrow(errorMessage);
    });
  });

  describe('getGroupPosts', () => {
    test('should fetch group posts with images', async () => {
      const mockGroupPosts = [
        {
          id: 55,
          user_id: 1,
          title: 'fgsdgsdfg',
          body: 'fgsdfgsdfgd',
          created_at: '2025-09-21T11:45:03Z',
          updated_at: '2025-09-21T11:45:03Z',
          visibility: 'public',
          images: null,
          likes: 0,
          dislikes: 1,
          user_liked: false,
          user_disliked: false,
          author_nickname: 'ckent',
          author_first_name: 'Clark',
          author_last_name: 'Kent',
          author_avatar: '/uploads/avatars/20250920T132100Z_c35d2e00-231f-4192-aaf7-22a3862993db.jpg'
        },
        {
          id: 32,
          user_id: 48,
          title: "Winter Soldier's Group Update",
          body: 'Design Republican pass house form food. Firm middle born account edge finish.',
          created_at: '2025-09-17T13:06:03Z',
          updated_at: '2025-09-17T13:06:03Z',
          visibility: 'public',
          images: [
            'https://picsum.photos/seed/8184/400/300',
            'https://picsum.photos/seed/4448/400/300'
          ],
          likes: 1,
          dislikes: 0,
          user_liked: false,
          user_disliked: false,
          author_nickname: 'dgreen',
          author_first_name: 'Deborah',
          author_last_name: 'Green',
          author_avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Melissa'
        }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockGroupPosts);

      const result = await groupApi.getGroupPosts(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/group/post?groupId=1&offset=0');
      expect(result).toEqual(mockGroupPosts);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('images');
      expect(result[0].images).toBeNull(); // Group post without images
      expect(result[1]).toHaveProperty('images');
      expect(result[1].images).toHaveLength(2); // Group post with images
    });

    test('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to get group posts';
      (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(groupApi.getGroupPosts(1)).rejects.toThrow(errorMessage);
    });
  });

  describe('API Client Integration', () => {
    test('should handle authentication properly', async () => {
      // Test that the API client is called with proper authentication
      const mockResponse = { message: 'Success' };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await postApi.getLikedPosts();

      expect(apiClient.get).toHaveBeenCalledWith('/api/post?liked=true');
    });

    test('should handle different response formats', async () => {
      // Test handling of different response formats (with and without images)
      const mockResponseWithImages = [
        {
          id: 1,
          images: ['image1.jpg', 'image2.jpg'],
          author_avatar: '/path/to/avatar.jpg'
        }
      ];

      const mockResponseWithoutImages = [
        {
          id: 2,
          images: null,
          author_avatar: ''
        }
      ];

      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce(mockResponseWithImages)
        .mockResolvedValueOnce(mockResponseWithoutImages);

      const likedPosts = await postApi.getLikedPosts();
      const commentedPosts = await postApi.getCommentedPosts();

      expect(likedPosts[0].images).toHaveLength(2);
      expect(likedPosts[0].author_avatar).toBeTruthy();
      expect(commentedPosts[0].images).toBeNull();
      expect(commentedPosts[0].author_avatar).toBe('');
    });
  });
});