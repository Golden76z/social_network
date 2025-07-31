
'use client';

import React from 'react';
import Header from '@/components/header';
import { useAuth } from '@/context/AuthProvider';
import { SideBarLeft } from '@/components/SideBarLeft';
import { SideBarRight } from '@/components/SideBarRight';
import { usePosts } from '@/lib/hooks/usePosts';
import { PostCard } from '@/components/PostCard';

const HomePage: React.FC = () => {
  const { user, isLoading: authLoading, hasCheckedAuth } = useAuth();
  const { posts, isLoading: postsLoading, error } = usePosts();

  if (!hasCheckedAuth || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
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
              {postsLoading && <p>Loading posts...</p>}
              {error && <p className="text-red-500">{error}</p>}
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
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
    </div>
  );
};

export default HomePage;
