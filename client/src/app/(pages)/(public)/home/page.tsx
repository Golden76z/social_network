'use client';

import React from 'react';
import Header from '@/components/header';
import { useAuth } from '@/context/AuthProvider';
import { SideBarLeft } from '@/components/SideBarLeft';
import { SideBarRight } from '@/components/SideBarRight';
import { Post } from '@/components/Post';

const HomePage: React.FC = () => {
  const { user, isLoading, hasCheckedAuth } = useAuth();

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
              <div className="space-y-4">
                <Post
                  username="Sample User"
                  timeAgo="2 hours ago"
                  content="This is a sample post in your feed. Posts from friends and followed accounts will appear here."
                />
                <Post
                  username="Sample User"
                  timeAgo="2 hours ago"
                  content="This is another example of a post shown in the timeline."
                />
                <Post
                  username="Sample User"
                  timeAgo="3 hours ago"
                  content="And one more example to showcase the feed responsiveness."
                />
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
