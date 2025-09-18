'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';
import { postApi } from '@/lib/api/post';
import { Post } from '@/lib/types';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        setError(null);
        
        console.log('User status:', user ? 'authenticated' : 'not authenticated');
        
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
        setError(error instanceof Error ? error.message : 'Failed to fetch posts');
        setPosts([]); // Ensure posts is always an array
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [user]);

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
      let updatedPosts;
      if (user) {
        updatedPosts = await postApi.getUserFeed();
      } else {
        updatedPosts = await postApi.getPublicPosts();
      }
      setPosts(updatedPosts || []);
    } catch (error) {
      console.error('Error refreshing posts after modal close:', error);
    }
  };

  const handleUserClick = (userId: number) => {
    router.push(`/profile?userId=${userId}`);
  };

  const handleLike = async (postId: number) => {
    try {
      let updatedPosts;
      if (user) {
        updatedPosts = await postApi.getUserFeed();
      } else {
        updatedPosts = await postApi.getPublicPosts();
      }
      setPosts(updatedPosts || []);
      
      if (selectedPost?.id === postId) {
        const updatedPost = updatedPosts?.find(p => p.id === postId);
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

  return (
    <div className="w-full">
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
                  ? "Your personalized feed is empty. Follow some users or create a post!" 
                  : "No public posts available. Sign in to see more content!"}
              </p>
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
                  disableLikes={!user}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
        disableInteractions={!user}
      />
    </div>
  );
};

export default HomePage;