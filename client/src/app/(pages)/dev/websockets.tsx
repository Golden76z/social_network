"use client"

import React, { useEffect, useState } from 'react';
import { ChatComponent } from '@/components/chatComponent';

export default function WebSocketPage() {  // Changed to default export
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || '';
    setAuthToken(token);
  }, []);

  if (!authToken) {
    return <div className="text-center mt-10">Please log in to access the chat.</div>;
  }

  return (
    // Remove WebSocketProvider here since it's already provided globally in Providers.tsx
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Social Network Chat</h1>
        <ChatComponent />
      </div>
    </div>
  );
}