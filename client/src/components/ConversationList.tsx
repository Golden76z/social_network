"use client"

import { useEffect, useState } from 'react';
import { Conversation } from '@/lib/types/chat';
import { chatAPI } from '@/lib/api/chat';
import { useAuthReady } from '@/hooks/useAuthGuard';

interface ConversationListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: number;
}

export function ConversationList({ onConversationSelect, selectedConversationId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthReady = useAuthReady();

  useEffect(() => {
    // Only load conversations when auth is ready
    if (isAuthReady) {
      loadConversations();
    }
  }, [isAuthReady]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getDisplayName = (conversation: Conversation) => {
    if (conversation.other_user_first_name && conversation.other_user_last_name) {
      return `${conversation.other_user_first_name} ${conversation.other_user_last_name}`;
    }
    return conversation.other_user_nickname;
  };

  const getInitials = (conversation: Conversation) => {
    const name = getDisplayName(conversation);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button 
            onClick={loadConversations}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start a conversation by messaging someone you follow!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <div
          key={conversation.other_user_id}
          onClick={() => onConversationSelect(conversation)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            selectedConversationId === conversation.other_user_id
              ? 'bg-blue-100 border border-blue-300'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {conversation.other_user_avatar ? (
                <img
                  src={conversation.other_user_avatar}
                  alt={getDisplayName(conversation)}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(conversation)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm truncate">
                  {getDisplayName(conversation)}
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  {formatTime(conversation.last_message_time)}
                </div>
              </div>
              <div className="text-xs text-gray-600 truncate mt-1">
                {conversation.last_message}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
