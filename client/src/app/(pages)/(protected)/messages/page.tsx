"use client"

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Conversation } from '@/lib/types/chat';
import { chatAPI, GroupConversation } from '@/lib/api/chat';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { useAuth } from '@/context/AuthProvider';
import { PrivateChat } from '@/components/PrivateChat';
import { GroupChat } from '@/components/GroupChat';
import Button from "@/components/ui/button";
import { NewConversationModal } from "@/components/NewConversationModal";
import { User } from "@/lib/types/user";
import type { WebSocketMessage } from '@/lib/hooks/useWebSockets';

type UnifiedConversation = 
  | { type: 'private'; data: Conversation }
  | { type: 'group'; data: GroupConversation };

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [privateConversations, setPrivateConversations] = useState<Conversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [unifiedConversations, setUnifiedConversations] = useState<UnifiedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const { lastMessage } = useWebSocketContext();
  const { user } = useAuth();
  const userId = user?.id;

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const [privateData, groupData] = await Promise.all([
        chatAPI.getConversations(),
        chatAPI.getGroupConversations()
      ]);

      const privateConversations = privateData || [];
      const groupConversations = groupData || [];

      setPrivateConversations(privateConversations);
      setGroupConversations(groupConversations);

      const unified: UnifiedConversation[] = [
        ...privateConversations.map(conv => ({ type: 'private' as const, data: conv })),
        ...groupConversations.map(conv => ({ type: 'group' as const, data: conv }))
      ].sort((a, b) => {
        const aTime = a.type === 'private' ? a.data.last_message_time : a.data.last_message_time;
        const bTime = b.type === 'private' ? b.data.last_message_time : b.data.last_message_time;
        return new Date(bTime || 0).getTime() - new Date(aTime || 0).getTime();
      });

      setUnifiedConversations(unified);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  type ConversationUpdatePayload = {
    conversation_type?: 'private' | 'group';
    user_id?: number;
    group_id?: string | number;
    last_message?: string;
    last_message_time?: string;
  };

  const handleConversationUpdate = useCallback((message: WebSocketMessage) => {
    const data = message.data as ConversationUpdatePayload | undefined;
    if (!data) return;

    const { conversation_type, user_id, group_id, last_message, last_message_time } = data;

    if (conversation_type === 'private') {
      setPrivateConversations(prev => prev.map(conv => {
        if (conv.other_user_id === user_id) {
          return {
            ...conv,
            last_message: last_message ?? conv.last_message,
            last_message_time: last_message_time ?? conv.last_message_time,
          };
        }
        return conv;
      }));
    } else if (conversation_type === 'group') {
      setGroupConversations(prev => prev.map(conv => {
        if (conv.group_id === Number(group_id)) {
          return {
            ...conv,
            last_message: last_message ?? conv.last_message,
            last_message_time: last_message_time ?? conv.last_message_time,
          };
        }
        return conv;
      }));
    }

    void loadConversations();
  }, [loadConversations]);

  type PrivateMessagePayload = {
    sender_id?: number;
    receiver_id?: number;
  };

  type GroupMessagePayload = {
    group_id?: string;
  };

  const handleNewMessage = useCallback((message: WebSocketMessage) => {
    if (!userId) return;

    if (message.type === 'private_message') {
      const messageData = message.data as PrivateMessagePayload | undefined;
      const senderId = messageData?.sender_id;
      const receiverId = messageData?.receiver_id;

      if ((receiverId !== undefined && receiverId === userId) || (senderId !== undefined && senderId === userId)) {
        // Update conversation in the list without reloading
        const otherUserId = senderId === userId ? receiverId : senderId;
        
        if (otherUserId !== undefined) {
          setPrivateConversations(prev => prev.map(conv => {
            if (conv.other_user_id === otherUserId) {
              return {
                ...conv,
                last_message: message.content || '',
                last_message_time: message.timestamp,
              };
            }
            return conv;
          }));

          // Update selected conversation if it's the current one
          if (selectedConversation?.type === 'private' && selectedConversation.data.other_user_id === otherUserId) {
            setSelectedConversation(prev => {
              if (!prev || prev.type !== 'private') return prev;
              return {
                ...prev,
                data: {
                  ...prev.data,
                  last_message: message.content || '',
                  last_message_time: message.timestamp,
                }
              };
            });
          }
        }
      }
    } else if (message.type === 'group_message') {
      const groupPayload = message.data as GroupMessagePayload | undefined;
      const groupId = message.group_id || groupPayload?.group_id;

      if (groupId) {
        // Update group conversation in the list without reloading
        setGroupConversations(prev => prev.map(conv => {
          if (conv.group_id === Number(groupId)) {
            return {
              ...conv,
              last_message: message.content || '',
              last_message_time: message.timestamp,
            };
          }
          return conv;
        }));

        // Update selected conversation if it's the current one
        if (selectedConversation?.type === 'group' && selectedConversation.data.group_id.toString() === String(groupId)) {
          setSelectedConversation(prev => {
            if (!prev || prev.type !== 'group') return prev;
            return {
              ...prev,
              data: {
                ...prev.data,
                last_message: message.content || '',
                last_message_time: message.timestamp,
              }
            };
          });
        }
      }
    }
  }, [userId, selectedConversation]);

  // Handle URL parameters for navigation from sidebar
  useEffect(() => {
    const groupId = searchParams.get('group');
    const userParam = searchParams.get('user');
    
    if (groupId && groupConversations.length > 0) {
      const groupConv = groupConversations.find(conv => conv.group_id === parseInt(groupId));
      if (groupConv) {
        setSelectedConversation({ type: 'group', data: groupConv });
      }
    } else if (userParam && privateConversations.length > 0) {
      const privateConv = privateConversations.find(conv => conv.other_user_id === parseInt(userParam));
      if (privateConv) {
        setSelectedConversation({ type: 'private', data: privateConv });
      }
    }
  }, [searchParams, groupConversations, privateConversations]);

  // Handle real-time message updates
  useEffect(() => {
    if (!lastMessage || !userId) return;

    if (lastMessage.type === 'conversation_update') {
      handleConversationUpdate(lastMessage);
      return;
    }

    if (lastMessage.type === 'private_message' || lastMessage.type === 'group_message') {
      handleNewMessage(lastMessage);
    }
  }, [lastMessage, userId, handleConversationUpdate, handleNewMessage]);

  // Load conversations on component mount
  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const getInitials = (conversation: UnifiedConversation) => {
    if (conversation.type === 'private') {
      const firstName = conversation.data.other_user_first_name || '';
      const lastName = conversation.data.other_user_last_name || '';
      const nickname = conversation.data.other_user_nickname || '';
      
      if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      } else if (nickname) {
        return nickname.charAt(0).toUpperCase();
      }
    } else {
      return conversation.data.group_name.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getDisplayName = (conversation: UnifiedConversation) => {
    if (conversation.type === 'private') {
      if (conversation.data.other_user_first_name && conversation.data.other_user_last_name) {
        return `${conversation.data.other_user_first_name} ${conversation.data.other_user_last_name}`;
      }
      return conversation.data.other_user_nickname;
    } else {
      return conversation.data.group_name;
    }
  };

  const getLastMessage = (conversation: UnifiedConversation) => {
    return conversation.data.last_message || 'No messages yet';
  };

  const getLastMessageTime = (conversation: UnifiedConversation) => {
    return conversation.data.last_message_time;
  };

  const handleStartNewConversation = async (selectedUser: User) => {
    console.log('🔍 handleStartNewConversation called with user:', selectedUser);
    console.log('🔍 User object type:', typeof selectedUser);
    console.log('🔍 User.id:', selectedUser.id, 'type:', typeof selectedUser.id);

    // Find if conversation already exists
    const existingConversation = privateConversations.find(
      conv => conv.other_user_id === selectedUser.id
    );

    if (existingConversation) {
      // Select existing conversation
      setSelectedConversation({ type: 'private', data: existingConversation });
    } else {
      // Create new conversation object (this will be created when first message is sent)
      const newConversation: Conversation = {
        other_user_id: selectedUser.id,
        other_user_nickname: selectedUser.nickname,
        other_user_first_name: selectedUser.first_name,
        other_user_last_name: selectedUser.last_name,
        other_user_avatar: selectedUser.avatar || '',
        other_user_is_private: selectedUser.is_private,
        last_message: '',
        last_message_time: new Date().toISOString(),
      };

      setSelectedConversation({ type: 'private', data: newConversation });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] w-full px-2">

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-destructive text-sm mb-4 flex-shrink-0 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-3 text-destructive/70 hover:text-destructive transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 h-full">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden lg:block lg:col-span-1' : 'lg:col-span-1'}`}>
          <div className="h-full border border-border rounded-xl bg-card flex flex-col shadow-sm backdrop-blur-sm">
            <div className="p-4 border-b border-border bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-card-foreground text-base">Conversations</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">{unifiedConversations.length} active</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewConversationModal(true)}
                    className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 border border-purple-200 hover:border-purple-300 transition-all duration-200 flex items-center justify-center text-purple-600 hover:text-purple-700"
                    title="New Conversation"
                  >
                    <span className="text-sm font-medium">+</span>
                  </button>
                  {selectedConversation && (
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {unifiedConversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="font-medium mb-2 text-sm">No conversations yet</p>
                  <p className="text-xs">Start a new conversation to begin messaging</p>
                </div>
              ) : (
                <div className="p-2">
                  {unifiedConversations.map((conversation) => {
                    const isSelected = selectedConversation?.type === conversation.type && 
                      (conversation.type === 'private' 
                        ? (selectedConversation.data as Conversation).other_user_id === (conversation.data as Conversation).other_user_id
                        : (selectedConversation.data as GroupConversation).group_id === (conversation.data as GroupConversation).group_id);
                    
                    return (
                      <div
                        key={`${conversation.type}-${conversation.type === 'private' ? (conversation.data as Conversation).other_user_id : (conversation.data as GroupConversation).group_id}`}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          // On mobile, hide the conversation list after selection
                          if (window.innerWidth < 1024) {
                            // This will be handled by the responsive classes
                          }
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${
                          isSelected
                            ? 'bg-purple-100 border border-purple-200 shadow-sm'
                            : 'hover:bg-purple-50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium flex-shrink-0 shadow-sm ${
                            conversation.type === 'group' ? 'bg-gradient-to-br from-purple-400 to-purple-500' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                          }`}>
                            {conversation.type === 'private' && conversation.data.other_user_avatar ? (
                              <img
                                src={conversation.data.other_user_avatar}
                                alt={getDisplayName(conversation)}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(conversation)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-sm truncate text-card-foreground">
                                {getDisplayName(conversation)}
                              </div>
                              {conversation.type === 'group' && (
                                <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                                  Group
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate line-clamp-1">
                              {getLastMessage(conversation)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0 bg-purple-100 px-2 py-1 rounded-full">
                            {getLastMessageTime(conversation) && formatTime(getLastMessageTime(conversation))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedConversation ? 'lg:col-span-2' : 'hidden lg:block lg:col-span-2'}`}>
          <div className="h-full border border-border rounded-xl bg-card shadow-sm backdrop-blur-sm overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Mobile back button */}
                <div className="lg:hidden p-3 border-b border-border bg-gradient-to-r from-purple-100 to-purple-200/50">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>←</span>
                    <span>Back to conversations</span>
                  </button>
                </div>
                {selectedConversation.type === 'private' ? (
                  <PrivateChat 
                    conversation={selectedConversation.data} 
                    currentUserId={user?.id || 0} 
                  />
                ) : (
                  <GroupChat
                    groupId={selectedConversation.data.group_id}
                    groupName={selectedConversation.data.group_name}
                    currentUserId={user?.id || 0}
                  />
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-card to-card/50">
                <div className="text-center text-muted-foreground">
                  <div className="text-6xl mb-6">💬</div>
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onUserSelect={handleStartNewConversation}
      />
    </div>
  );
}
