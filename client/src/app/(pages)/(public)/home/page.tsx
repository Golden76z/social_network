'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { useAuth } from '@/context/AuthProvider';
import { SideBarLeft } from '@/components/SideBarLeft';
import { SideBarRight } from '@/components/SideBarRight';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';
import { postApi } from '@/lib/api/post';
import { Post } from '@/lib/types';

const HomePage: React.FC = () => {
  const { user, isLoading, hasCheckedAuth } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        const postsData = await postApi.getAllPosts();
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (hasCheckedAuth && !isLoading) {
      fetchPosts();
    }
  }, [hasCheckedAuth, isLoading]);

  const handleViewDetails = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    
    // Always refresh posts when closing modal to ensure sync
    try {
      const updatedPosts = await postApi.getAllPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error refreshing posts after modal close:', error);
    }
  };

  const handleUserClick = (userId: number) => {
    // Navigate to user profile
    router.push(`/profile?userId=${userId}`);
  };

  const handleLike = async (postId: number) => {
    // Refresh posts to get updated like counts
    try {
      const updatedPosts = await postApi.getAllPosts();
      setPosts(updatedPosts);
      
      // Update selected post if it's the same
      if (selectedPost?.id === postId) {
        const updatedPost = updatedPosts.find(p => p.id === postId);
        if (updatedPost) {
          setSelectedPost(updatedPost);
        }
      }
    } catch (error) {
      console.error('Error refreshing posts after like:', error);
    }
  };

  const handleComment = (postId: number) => {
    handleViewDetails(postId);
  };

  // Wait for auth check to complete
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="flex flex-col md:flex-row max-w-full mx-auto">
        <div className="hidden md:block w-[20%] min-h-screen bg-white border-r border-gray-200 p-4">
          <SideBarLeft variant="sidebar" />
        </div>

        <div className="w-full md:w-[70%] px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold mb-4">
            {user
              ? `Welcome back, ${user.nickname || user.first_name}!`
              : 'Welcome!'}
          </h1>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Recent Posts</h3>
              
              {loadingPosts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-500">Loading posts...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No posts available yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Be the first to create a post!</p>
                </div>
              ) : (
                <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onViewDetails={handleViewDetails}
                    onUserClick={handleUserClick}
                  />
                ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:block w-[20%] min-h-screen bg-white border-l border-gray-200 p-4">
          <SideBarRight />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white shadow-sm">
        <SideBarLeft variant="bottom" />
      </div>

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
      />
    </div>
  );
};

export default HomePage;