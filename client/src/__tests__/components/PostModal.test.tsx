import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostModal } from '@/components/posts/PostModal';
import { Post, Comment } from '@/lib/types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the comment API
jest.mock('@/lib/api/comment', () => ({
  commentApi: {
    getComments: jest.fn(),
    createComment: jest.fn(),
  },
}));

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
  body: 'This is a test post content.',
  visibility: 'public',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  images: ['https://example.com/image1.jpg'],
  likes: 5,
  dislikes: 1,
  user_liked: false,
  user_disliked: false,
  author_id: 123,
  author_nickname: 'testuser',
  author_first_name: 'Test',
  author_last_name: 'User',
};

const mockComments: Comment[] = [
  {
    id: 1,
    post_id: 1,
    user_id: 456,
    body: 'This is a test comment',
    created_at: '2023-01-01T01:00:00Z',
    updated_at: '2023-01-01T01:00:00Z',
  },
  {
    id: 2,
    post_id: 1,
    user_id: 789,
    body: 'Another test comment',
    created_at: '2023-01-01T02:00:00Z',
    updated_at: '2023-01-01T02:00:00Z',
  },
];

describe('PostModal', () => {
  const mockOnClose = jest.fn();
  const mockOnLike = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={false}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    expect(screen.queryByText('Post Details')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    expect(screen.getByText('Post Details')).toBeInTheDocument();
    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test post content.')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should load and display comments', async () => {
    const { commentApi } = require('@/lib/api/comment');
    commentApi.getComments.mockResolvedValue(mockComments);

    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    await waitFor(() => {
      expect(commentApi.getComments).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('Another test comment')).toBeInTheDocument();
    });
  });

  it('should handle comment creation', async () => {
    const { commentApi } = require('@/lib/api/comment');
    commentApi.getComments.mockResolvedValue([]);
    commentApi.createComment.mockResolvedValue({});

    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    const commentInput = screen.getByPlaceholderText('Write a comment...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(commentInput, { target: { value: 'New comment' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(commentApi.createComment).toHaveBeenCalledWith({
        post_id: 1,
        body: 'New comment',
      });
    });
  });

  it('should handle like functionality', async () => {
    const { reactionApi } = require('@/lib/api/reaction');
    reactionApi.createReaction.mockResolvedValue({});

    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
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

  it('should close modal when close button is clicked', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when escape key is pressed', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when clicking outside', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    const backdrop = screen.getByRole('dialog').parentElement;
    fireEvent.mouseDown(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close modal when clicking inside', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    const modalContent = screen.getByRole('dialog');
    fireEvent.mouseDown(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable interactions when disableInteractions is true', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
        disableInteractions={true}
      />
    );

    expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
    
    // When disableInteractions is true, the like button is rendered as a div, not a button
    const likeElement = screen.getByText('5'); // The like count
    expect(likeElement).toBeInTheDocument();
    
    // Verify that the like button is not clickable (it's a div, not a button)
    expect(screen.queryByRole('button', { name: /like/i })).not.toBeInTheDocument();
  });

  it('should display images correctly', () => {
    const postWithImages = {
      ...mockPost,
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    };

    render(
      <PostModal
        post={postWithImages}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
  });

  it('should handle posts without images', () => {
    const postWithoutImages = { ...mockPost, images: [] };

    render(
      <PostModal
        post={postWithoutImages}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('should show loading state for comments', () => {
    const { commentApi } = require('@/lib/api/comment');
    commentApi.getComments.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
  });

  it('should show empty state when no comments', async () => {
    const { commentApi } = require('@/lib/api/comment');
    commentApi.getComments.mockResolvedValue([]);

    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
    });
  });

  it('should handle comment creation error', async () => {
    const { commentApi } = require('@/lib/api/comment');
    commentApi.getComments.mockResolvedValue([]);
    commentApi.createComment.mockRejectedValue(new Error('Failed to create comment'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onLike={mockOnLike}
      />
    );

    const commentInput = screen.getByPlaceholderText('Write a comment...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(commentInput, { target: { value: 'New comment' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error creating comment:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
