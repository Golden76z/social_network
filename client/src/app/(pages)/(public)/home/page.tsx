'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { PostCard } from '@/components/posts/PostCard';
import { PostModal } from '@/components/posts/PostModal';
import { CreatePostModal } from '@/components/forms/CreatePostModal';
import DevAccessDenied from '@/components/DevAccessDenied';
import { postApi } from '@/lib/api/post';
import { groupApi } from '@/lib/api/group';
import { Post } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        setError(null);

        console.log(
          'User status:',
          user ? 'authenticated' : 'not authenticated',
        );

        let postsData;
        if (user) {
          console.log('Fetching user feed...');
          postsData = await postApi.getUserFeed();
        } else {
          console.log('Fetching public posts...');
          postsData = await postApi.getPublicPosts();
        }

        console.log('Posts received:', postsData?.length || 0);
        setPosts(postsData || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to fetch posts',
        );
        setPosts([]); // Ensure posts is always an array
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [user]);

  const handleViewDetails = (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    // No need to refresh posts - the like/comment actions already update the local state
  };

  const handleUserClick = (userId: number) => {
    if (user) {
      router.push(`/profile?userId=${userId}`);
    } else {
      router.push('/login');
    }
  };

  const handleLike = async (postId: number) => {
    // The PostCard component handles the optimistic update
    // No need to refresh all posts from the API
  };

  const handleComment = (postId: number) => {
    handleViewDetails(postId);
  };

  const handleEditPost = async (post: Post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      setIsDeleting(true);
      
      // Check if this is a group post and use appropriate API
      if (postToDelete.post_type === 'group_post') {
        await groupApi.deleteGroupPost(postToDelete.id);
      } else {
        await postApi.deletePost(postToDelete.id);
      }
      
      // Remove the post from the local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));
      // Close the modal if it's open
      setIsModalOpen(false);
      setSelectedPost(null);
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      // Error will be handled by the UI
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletePost = () => {
    setShowDeleteConfirm(false);
    setPostToDelete(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPost(null);
  };

  const handleEditSuccess = async () => {
    // Refresh posts after successful edit
    try {
      let postsData;
      if (user) {
        postsData = await postApi.getUserFeed();
      } else {
        postsData = await postApi.getPublicPosts();
      }
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
    handleCloseEditModal();
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <DevAccessDenied />
      {/* <h1 className="text-2xl font-bold mb-4">
        {user
          ? `Welcome back, ${user.nickname || user.first_name}!`
          : 'Welcome!'}
      </h1> */}

      <div className="pt-8">
        {loadingPosts ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Loading posts..." />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 text-lg">Error loading posts</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No posts available yet.</p>
          <p className="text-gray-400 text-sm mt-2">
            {user
              ? 'Your personalized feed is empty. Follow some users or create a post!'
              : 'No public posts available. Sign in to see more content!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  ease: "easeOut",
                  layout: { duration: 0.3, ease: "easeInOut" }
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="transform-gpu"
              >
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onViewDetails={handleViewDetails}
                  onUserClick={handleUserClick}
                  disableLikes={!user}
                  currentUserId={user?.id}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  isGroupPost={post.post_type === 'group_post'}
                  isGroupAdmin={false} // TODO: Check if user is group admin
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      </div>

      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
        disableInteractions={!user}
        isAuthenticated={!!user}
        isGroupPost={selectedPost?.post_type === 'group_post'}
        currentUserId={user?.id}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && postToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelDeletePost();
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Delete Post
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-foreground mb-4">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              
              {/* Post preview */}
              <div className="bg-muted p-3 rounded-lg border border-border">
                <h4 className="font-medium text-foreground mb-1">{postToDelete.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {postToDelete.body}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelDeletePost}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletePost}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg btn-delete disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <CreatePostModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          initialTitle={editingPost.title}
          initialContent={editingPost.body}
          initialImages={editingPost.images || []}
          postId={editingPost.id}
          isGroupPost={editingPost.post_type === 'group_post'}
          groupId={editingPost.group_id}
          groupName={editingPost.group_name}
        />
      )}

    </div>
  );
};

export default HomePage;
