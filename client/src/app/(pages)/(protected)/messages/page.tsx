"use client"

import { useState, useEffect } from 'react';
import { Conversation, User } from '@/lib/types/chat';
import { ConversationList } from '@/components/ConversationList';
import { PrivateChat } from '@/components/PrivateChat';
import { NewConversationModal } from '@/components/NewConversationModal';
import { WebSocketProvider } from '@/context/webSocketProvider';
import { chatAPI } from '@/lib/api/chat';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  useEffect(() => {
    // Get current user ID from localStorage or context
    // This should be replaced with proper auth context
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
  }, []);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = async (user: User) => {
    try {
      // Send an initial message to start the conversation
      await chatAPI.sendMessage({
        receiver_id: user.id,
        body: "Hello! 👋"
      });
      
      // Create a conversation object to select
      const newConversation: Conversation = {
        other_user_id: user.id,
        other_user_nickname: user.nickname,
        other_user_first_name: user.first_name || '',
        other_user_last_name: user.last_name || '',
        other_user_avatar: user.avatar || '',
        other_user_is_private: user.is_private || false,
        last_message: "Hello! 👋",
        last_message_time: new Date().toISOString(),
      };
      
      setSelectedConversation(newConversation);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';

  return (
    <WebSocketProvider url="ws://localhost:8080/ws" token={authToken}>
        <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              New Conversation
            </button>
            <div className="text-sm text-gray-500">
              {selectedConversation ? `Chatting with ${selectedConversation.other_user_nickname}` : 'Select a conversation'}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r bg-white">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <ConversationList
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversation?.other_user_id}
            />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <PrivateChat
                conversation={selectedConversation}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Conversation Modal */}
        <NewConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          onUserSelect={handleNewConversation}
        />

        </div>
    </WebSocketProvider>
  );
}