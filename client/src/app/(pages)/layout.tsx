'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import Header from '@/components/page_components/Header';
import { SideBarLeft } from '@/components/page_components/SideBarLeft';
import { SideBarRight } from '@/components/page_components/SideBarRight';
import Footer from '@/components/page_components/Footer';
import { CreatePostModal } from '@/components/forms/CreatePostModal';
import { PostModalWrapper } from '@/components/posts/PostModalWrapper';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, hasCheckedAuth, isInitializing, user } = useAuth();
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const handleCreatePostSuccess = () => {
    setShowCreatePostModal(false);
    // Refresh the page to show the new post
    window.location.reload();
  };

  const handleCreatePostClose = () => {
    setShowCreatePostModal(false);
  };

  const handlePostClick = (postId: number) => {
    setSelectedPostId(postId);
    setPostModalOpen(true);
  };

  const handleClosePostModal = () => {
    setPostModalOpen(false);
    setSelectedPostId(null);
  };


  // Show loading spinner while initializing or checking authentication
  // Keep loading screen persistent until we're fully ready to show content
  if (isInitializing || !hasCheckedAuth || isLoading) {
    console.log('🔄 PagesLayout: Showing loading screen', { isInitializing, hasCheckedAuth, isLoading });
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <LoadingSpinner 
          size="xl" 
          text="Loading..." 
          className="min-h-screen"
        />
      </div>
    );
  }

  console.log('✅ PagesLayout: Rendering content', { isInitializing, hasCheckedAuth, isLoading, user: user?.nickname });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        onCreatePost={() => setShowCreatePostModal(true)}
        onPostClick={handlePostClick}
      />
      <div className="flex flex-col md:flex-row max-w-full mx-auto">
        {/* Left Sidebar - desktop only */}
        <div className="hidden md:block w-[20%] min-h-screen bg-card border-r border-border p-4">
          <SideBarLeft variant="sidebar" />
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto p-4 flex flex-col">
          {children}
        </main>

        {/* Right Sidebar - desktop only */}
        <div className="hidden md:block w-[20%] min-h-screen bg-card border-l border-border p-4">
          <SideBarRight />
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card shadow-sm">
        <SideBarLeft variant="bottom" />
      </div>

      {/* Create Post Modal - rendered at layout level */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={handleCreatePostClose}
        onSuccess={handleCreatePostSuccess}
      />

      {/* Post Modal - rendered at layout level */}
      <PostModalWrapper
        postId={selectedPostId}
        isOpen={postModalOpen}
        onClose={handleClosePostModal}
        isAuthenticated={!!user}
        currentUserId={user?.id}
      />

    </div>
  );
}
