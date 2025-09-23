'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { PrivateChat } from '@/components/chat/PrivateChat';
import { GroupChat } from '@/components/chat/GroupChat';
import { NewConversationModal } from '@/components/chat/NewConversationModal';
import { useApiError } from '@/lib/error/errorContext';

export default function MessagesPage() {
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleError } = useApiError();
  
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  
  // Get conversation parameters from URL
  const userId = searchParams.get('user');
  const groupId = searchParams.get('group');
  const conversationId = searchParams.get('conversation');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access messages.</p>
        </div>
      </div>
    );
  }

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (conversationData: any) => {
    setShowNewConversationModal(false);
    // Navigate to the new conversation
    if (conversationData.type === 'private') {
      router.push(`/messages?user=${conversationData.userId}`);
    } else if (conversationData.type === 'group') {
      router.push(`/messages?group=${conversationData.groupId}`);
    }
  };

  const handleUserSelect = (user: any) => {
    setShowNewConversationModal(false);
    router.push(`/messages?user=${user.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <button
            onClick={handleNewConversation}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            New Conversation
          </button>
        </div>

        <div className="h-[calc(100vh-200px)]">
          {userId ? (
            <PrivateChat 
              conversation={{
                other_user_id: parseInt(userId),
                other_user_nickname: 'User',
                other_user_first_name: 'User',
                other_user_last_name: 'Name',
                other_user_avatar: '',
                other_user_is_private: false,
                last_message: '',
                last_message_time: '',
              }}
              currentUserId={user.id}
            />
          ) : groupId ? (
            <GroupChat 
              groupId={parseInt(groupId)}
              groupName="Group Chat"
              currentUserId={user.id}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">No Conversation Selected</h2>
                <p className="text-muted-foreground mb-4">
                  Start a new conversation or select an existing one from the sidebar.
                </p>
                <button
                  onClick={handleNewConversation}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {showNewConversationModal && (
          <NewConversationModal
            isOpen={showNewConversationModal}
            onClose={() => setShowNewConversationModal(false)}
            onUserSelect={handleUserSelect}
          />
        )}
      </div>
    </div>
  );
}