"use client"

import React from 'react';
import { ChatComponent } from '@/components/chat/chatComponent';
import { useAuth } from '@/context/AuthProvider';

export default function ChatPage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Chat</h1>
        <div className="h-[calc(100vh-200px)]">
          <ChatComponent />
        </div>
      </div>
    </div>
  );
}