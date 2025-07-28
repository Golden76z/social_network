'use client';

import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Post } from '@/components/Post';
import Layout from '@/components/ui/layout';
// import { BottomNav } from '@/components/BottomNav';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Main Feed - full width on mobile */}
      <div className="w-full md:w-[70%] px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold mb-4">
          Welcome back, {user?.username || user?.first_name}!
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
    </Layout>
  );
};

export default HomePage;
