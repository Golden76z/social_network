'use client';

import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import Header from '@/components/page_components/Header';
import { SideBarLeft } from '@/components/page_components/SideBarLeft';
import { SideBarRight } from '@/components/page_components/SideBarRight';

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, hasCheckedAuth } = useAuth();

  // Show loading spinner while checking authentication
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="flex flex-col md:flex-row max-w-full mx-auto">
        {/* Left Sidebar - desktop only */}
        <div className="hidden md:block w-[20%] min-h-screen bg-white border-r border-gray-200 p-4">
          <SideBarLeft variant="sidebar" />
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto p-4">
          {children}
        </main>

        {/* Right Sidebar - desktop only */}
        <div className="hidden md:block w-[20%] min-h-screen bg-white border-l border-gray-200 p-4">
          <SideBarRight />
        </div>
      </div>

      {/* Bottom Navigation - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white shadow-sm">
        <SideBarLeft variant="bottom" />
      </div>
    </div>
  );
}
