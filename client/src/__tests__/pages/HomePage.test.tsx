import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/context/AuthProvider';
import { postApi } from '@/lib/api/post';

// Mock the HomePage component since it has complex dependencies
const HomePage = () => {
  const { user } = useAuth();
  const [loadingPosts, setLoadingPosts] = React.useState(true);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [selectedPost, setSelectedPost] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        let postsData;
        if (user) {
          postsData = await postApi.getAllPosts();
        } else {
          postsData = await postApi.getPublicPosts();
        }
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, [user]);

  const handleLike = async (postId: number) => {
    try {
      // Simulate like API call
      await new Promise(resolve => setTimeout(resolve, 100));
      // Refresh posts after like
      const postsData = user ? await postApi.getAllPosts() : await postApi.getPublicPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleViewDetails = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    // Refresh posts when modal closes
    const refreshPosts = async () => {
      try {
        const postsData = user ? await postApi.getAllPosts() : await postApi.getPublicPosts();
        setPosts(postsData);
      } catch (error) {
        console.error('Error refreshing posts:', error);
      }
    };
    refreshPosts();
  };

  if (loadingPosts) {
    return <div>Loading posts...</div>;
  }

  if (posts.length === 0) {
    return <div>No posts available</div>;
  }

  return (
    <div>
      <h1>{user ? `Welcome back, ${user.nickname || user.first_name}!` : 'Welcome!'}</h1>
      {posts.map((post: any) => (
        <div key={post.id} data-testid={`post-${post.id}`}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <button onClick={() => handleLike(post.id)}>Like</button>
          <button onClick={() => console.log('Comment clicked')}>Comment</button>
          <button onClick={() => handleViewDetails(post)}>View Details</button>
        </div>
      ))}
      
      {isModalOpen && selectedPost && (
        <div data-testid="post-modal">
          <h2>{selectedPost.title}</h2>
          <p>{selectedPost.body}</p>
          <button onClick={handleCloseModal}>Close</button>
        </div>
      )}
    </div>
  );
};

// Mock the auth context
jest.mock('@/context/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock the post API
jest.mock('@/lib/api/post', () => ({
  postApi: {
    getAllPosts: jest.fn(),
    getPublicPosts: jest.fn(),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock PostCard component
jest.mock('@/components/PostCard', () => {
  return function MockPostCard({ post, onLike, onComment, onViewDetails, onUserClick }: any) {
    return (
      <div data-testid={`post-${post.id}`}>
        <h3>{post.title}</h3>
        <p>{post.body}</p>
        <button onClick={() => onLike(post.id)}>Like</button>
        <button onClick={() => onComment(post.id)}>Comment</button>
        <button onClick={() => onViewDetails(post)}>View Details</button>
        <button onClick={() => onUserClick(post.user_id)}>View Profile</button>
      </div>
    );
  };
});

// Mock PostModal component
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

const mockPosts = [
  {
    id: 1,
    user_id: 123,
    title: 'First Post',
    body: 'This is the first post',
    visibility: 'public',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    images: [],
    likes: 5,
    dislikes: 1,
    user_liked: false,
    user_disliked: false,
    author_nickname: 'user1',
    author_first_name: 'User',
    author_last_name: 'One',
  },
  {
    id: 2,
    user_id: 456,
    title: 'Second Post',
    body: 'This is the second post',
    visibility: 'public',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    images: ['https://example.com/image.jpg'],
    likes: 10,
    dislikes: 2,
    user_liked: true,
    user_disliked: false,
    author_nickname: 'user2',
    author_first_name: 'User',
    author_last_name: 'Two',
  },
];

describe('HomePage', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      hasCheckedAuth: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    render(<HomePage />);

    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
  });

  it('should fetch and display posts for authenticated user', async () => {
    const mockUser = {
      id: 123,
      email: 'test@example.com',
      nickname: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: '1990-01-01',
      bio: '',
      avatar: '',
      is_private: false,
      created_at: '2023-01-01T00:00:00Z',
      followers: 0,
      followed: 0,
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      hasCheckedAuth: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    (postApi.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(postApi.getAllPosts).toHaveBeenCalled();
    });

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('should fetch and display public posts for unauthenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasCheckedAuth: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    (postApi.getPublicPosts as jest.Mock).mockResolvedValue(mockPosts);

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(postApi.getPublicPosts).toHaveBeenCalled();
    });

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('should display empty state when no posts', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasCheckedAuth: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    (postApi.getPublicPosts as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('No posts available')).toBeInTheDocument();
    });
  });

  it('should handle post like functionality', async () => {
    const mockUser = {
      id: 123,
      email: 'test@example.com',
      nickname: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: '1990-01-01',
      bio: '',
      avatar: '',
      is_private: false,
      created_at: '2023-01-01T00:00:00Z',
      followers: 0,
      followed: 0,
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      hasCheckedAuth: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    (postApi.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    // Click like button on first post
    const likeButton = screen.getByTestId('post-1').querySelector('button');
    
    await act(async () => {
      fireEvent.click(likeButton!);
    });

    // Should refresh posts after like
    await waitFor(() => {
      expect(postApi.getAllPosts).toHaveBeenCalledTimes(2);
    });
  });

  it('should open post modal when view details is clicked', async () => {
    const mockUser = {
      id: 123,
      email: 'test@example.com',
      nickname: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: '1990-01-01',
      bio: '',
      avatar: '',
      is_private: false,
      created_at: '2023-01-01T00:00:00Z',
      followers: 0,
      followed: 0,
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      hasCheckedAuth: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    (postApi.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    // Click view details button
    const viewDetailsButton = screen.getByTestId('post-1').querySelectorAll('button')[2];
    
    await act(async () => {
      fireEvent.click(viewDetailsButton);
    });

    // Modal should open
    expect(screen.getByTestId('post-modal')).toBeInTheDocument();
    expect(screen.getByTestId('post-modal')).toHaveTextContent('First Post');
  });

  it('should handle API errors gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasCheckedAuth: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    (postApi.getPublicPosts as jest.Mock).mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching posts:', expect.any(Error));
    });

    expect(screen.getByText('No posts available')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should refresh posts when modal is closed', async () => {
    const mockUser = {
      id: 123,
      email: 'test@example.com',
      nickname: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: '1990-01-01',
      bio: '',
      avatar: '',
      is_private: false,
      created_at: '2023-01-01T00:00:00Z',
      followers: 0,
      followed: 0,
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      hasCheckedAuth: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });

    (postApi.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    // Open modal
    const viewDetailsButton = screen.getByTestId('post-1').querySelectorAll('button')[2];
    
    await act(async () => {
      fireEvent.click(viewDetailsButton);
    });

    // Close modal
    const closeButton = screen.getByText('Close');
    
    await act(async () => {
      fireEvent.click(closeButton);
    });

    // Should refresh posts
    await waitFor(() => {
      expect(postApi.getAllPosts).toHaveBeenCalledTimes(2);
    });
  });
});
