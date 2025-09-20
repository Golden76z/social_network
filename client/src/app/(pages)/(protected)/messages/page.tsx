"use client"

import { useState, useEffect, useCallback } from 'react';
import { Conversation, PrivateMessage } from '@/lib/types/chat';
import { chatAPI, GroupConversation } from '@/lib/api/chat';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { useAuth } from '@/context/AuthProvider';
import { PrivateChat } from '@/components/PrivateChat';
import { GroupChat } from '@/components/GroupChat';
import Button from "@/components/ui/button";

type ConversationType = 'private' | 'group';
type UnifiedConversation = 
  | { type: 'private'; data: Conversation }
  | { type: 'group'; data: GroupConversation };

export default function MessagesPage() {
  const [privateConversations, setPrivateConversations] = useState<Conversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [unifiedConversations, setUnifiedConversations] = useState<UnifiedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lastMessage } = useWebSocketContext();
  const { user } = useAuth();

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle real-time message updates
  useEffect(() => {
    if ((lastMessage?.type === 'private_message' || lastMessage?.type === 'group_message') && user) {
      handleNewMessage(lastMessage);
    }
  }, [lastMessage, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const [privateData, groupData] = await Promise.all([
        chatAPI.getConversations(),
        chatAPI.getGroupConversations()
      ]);
      
      // Ensure we have arrays, not null values
      const privateConversations = privateData || [];
      const groupConversations = groupData || [];
      
      setPrivateConversations(privateConversations);
      setGroupConversations(groupConversations);
      
      // Create unified conversations list sorted by last message time
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
  };

  const handleNewMessage = useCallback((message: any) => {
    if (!user) return;

    if (message.type === 'private_message') {
      const messageData = message.data as any;
      const senderId = messageData?.sender_id;
      const receiverId = messageData?.receiver_id;

      // Check if this message is for the current user
      if (receiverId === user.id || senderId === user.id) {
        // Reload conversations to get updated data
        loadConversations();

        // Update selected conversation if it matches
        if (selectedConversation?.type === 'private') {
          const otherUserId = senderId === user.id ? receiverId : senderId;
          if (selectedConversation.data.other_user_id === otherUserId) {
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
      const groupId = message.group_id;
      
      // Reload conversations to get updated data
      loadConversations();

      // Update selected conversation if it matches
      if (selectedConversation?.type === 'group' && selectedConversation.data.group_id.toString() === groupId) {
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
  }, [user, selectedConversation, loadConversations]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <Button variant="outline" type="button">
          New Conversation
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm mb-4 flex-shrink-0">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="h-full border border-border rounded-lg bg-card flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-card-foreground">Conversations</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {unifiedConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="text-2xl mb-2">💬</div>
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a new conversation to begin messaging</p>
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
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium flex-shrink-0 ${
                            conversation.type === 'group' ? 'bg-secondary' : 'bg-primary'
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
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate text-card-foreground">
                                {getDisplayName(conversation)}
                              </div>
                              {conversation.type === 'group' && (
                                <span className="text-xs bg-secondary text-secondary-foreground px-1 rounded">
                                  Group
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {getLastMessage(conversation)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0">
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
        <div className="lg:col-span-2">
          <div className="h-full border border-border rounded-lg bg-card">
            {selectedConversation ? (
              selectedConversation.type === 'private' ? (
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
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-4">💬</div>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
