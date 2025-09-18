import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostCard } from '@/components/PostCard';
import { Post } from '@/lib/types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the reaction API
jest.mock('@/lib/api/reaction', () => ({
  reactionApi: {
    createReaction: jest.fn(),
  },
}));

const mockPost: Post = {
  id: 1,
  user_id: 123,
  title: 'Test Post',
  body: 'This is a test post with some content that should be truncated if it\'s too long.',
  visibility: 'public',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  likes: 5,
  dislikes: 1,
  user_liked: false,
  user_disliked: false,
  author_id: 123,
  author_nickname: 'testuser',
  author_first_name: 'Test',
  author_last_name: 'User',
};

const mockPostWithLongContent: Post = {
  ...mockPost,
  body: 'This is a very long post content that should definitely be truncated because it exceeds the maximum length allowed for display on the card. It should be cut off and show an ellipsis to indicate there is more content available.',
};

describe('PostCard', () => {
  const mockOnLike = jest.fn();
  const mockOnComment = jest.fn();
  const mockOnViewDetails = jest.fn();
  const mockOnUserClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render post content correctly', () => {
    render(
      <PostCard
        post={mockPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // likes count
  });

  it('should truncate long content', () => {
    render(
      <PostCard
        post={mockPostWithLongContent}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const contentElement = screen.getByText(/This is a very long post content/);
    expect(contentElement).toHaveClass('line-clamp-2');
  });

  it('should display images correctly', () => {
    render(
      <PostCard
        post={mockPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
  });

  it('should handle single image display', () => {
    const singleImagePost = { ...mockPost, images: ['https://example.com/single.jpg'] };
    
    render(
      <PostCard
        post={singleImagePost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/single.jpg');
    expect(image).toHaveClass('w-full', 'max-h-48', 'object-cover', 'rounded-lg', 'cursor-pointer');
  });

  it('should call onLike when like button is clicked', async () => {
    const { reactionApi } = require('@/lib/api/reaction');
    reactionApi.createReaction.mockResolvedValue({});

    render(
      <PostCard
        post={mockPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(reactionApi.createReaction).toHaveBeenCalledWith({
        post_id: 1,
        type: 'like',
      });
      expect(mockOnLike).toHaveBeenCalledWith(1);
    });
  });

  it('should call onComment when comment button is clicked', () => {
    render(
      <PostCard
        post={mockPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const commentButton = screen.getByRole('button', { name: /comment/i });
    fireEvent.click(commentButton);

    expect(mockOnComment).toHaveBeenCalledWith(1);
  });

  it('should call onViewDetails when view details button is clicked', () => {
    render(
      <PostCard
        post={mockPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const viewButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockPost.id);
  });

  it('should call onUserClick when user nickname is clicked', () => {
    render(
      <PostCard
        post={mockPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const userNickname = screen.getByText('testuser');
    fireEvent.click(userNickname);

    expect(mockOnUserClick).toHaveBeenCalledWith(123);
  });

  it('should disable likes when disableLikes is true', () => {
    render(
      <PostCard
        post={mockPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
        disableLikes={true}
      />
    );

    // When disableLikes is true, the like element is rendered as a div, not a button
    const likeElement = screen.getByText('5'); // The like count
    expect(likeElement).toBeInTheDocument();
    
    // Verify that the like button is not clickable (it's a div, not a button)
    expect(screen.queryByRole('button', { name: /like/i })).not.toBeInTheDocument();
  });

  it('should show liked state correctly', () => {
    const likedPost = { ...mockPost, user_liked: true };
    
    render(
      <PostCard
        post={likedPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toHaveClass('text-red-500');
  });

  it('should format date correctly', () => {
    const recentPost = {
      ...mockPost,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    };
    
    render(
      <PostCard
        post={recentPost}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('should handle posts without images', () => {
    const postWithoutImages = { ...mockPost, images: [] };
    
    render(
      <PostCard
        post={postWithoutImages}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('should handle posts without title', () => {
    const postWithoutTitle = { ...mockPost, title: '' };
    
    render(
      <PostCard
        post={postWithoutTitle}
        onLike={mockOnLike}
        onComment={mockOnComment}
        onViewDetails={mockOnViewDetails}
        onUserClick={mockOnUserClick}
      />
    );

    expect(screen.queryByText('Test Post')).not.toBeInTheDocument();
    expect(screen.getByText(/This is a test post/)).toBeInTheDocument();
  });
});
