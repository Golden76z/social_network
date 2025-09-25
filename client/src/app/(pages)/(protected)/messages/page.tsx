"use client"

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Conversation, PrivateMessage } from '@/lib/types/chat';
import { chatAPI, GroupConversation } from '@/lib/api/chat';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { useAuth } from '@/context/AuthProvider';
import { PrivateChat } from '@/components/chat/PrivateChat';
import { GroupChat } from '@/components/chat/GroupChat';
import Button from "@/components/ui/button";
import { NewConversationModal } from "@/components/chat/NewConversationModal";
import { User } from "@/lib/types/user";
import { motion, AnimatePresence } from 'framer-motion';

type ConversationType = 'private' | 'group';
type UnifiedConversation = 
  | { type: 'private'; data: Conversation }
  | { type: 'group'; data: GroupConversation };

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [privateConversations, setPrivateConversations] = useState<Conversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [unifiedConversations, setUnifiedConversations] = useState<UnifiedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const { lastMessage } = useWebSocketContext();
  const { user } = useAuth();

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle URL parameters for navigation from sidebar
  useEffect(() => {
    const groupId = searchParams.get('group');
  const userId = searchParams.get('user');
    
    if (groupId && groupConversations.length > 0) {
      const groupConv = groupConversations.find(conv => conv.group_id === parseInt(groupId));
      if (groupConv) {
        setSelectedConversation({ type: 'group', data: groupConv });
      }
    } else if (userId && privateConversations.length > 0) {
      const privateConv = privateConversations.find(conv => conv.other_user_id === parseInt(userId));
      if (privateConv) {
        setSelectedConversation({ type: 'private', data: privateConv });
      }
    }
  }, [searchParams, groupConversations, privateConversations]);

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
        // Update conversations list without reloading all conversations
        setUnifiedConversations(prev => {
          return prev.map(conv => {
            if (conv.type === 'private' && conv.data.other_user_id === (senderId === user.id ? receiverId : senderId)) {
              return {
                ...conv,
                data: {
                  ...conv.data,
                  last_message: message.content || '',
                  last_message_time: message.timestamp,
                }
              };
            }
            return conv;
          }).sort((a, b) => {
            const aTime = a.type === 'private' ? a.data.last_message_time : a.data.last_message_time;
            const bTime = b.type === 'private' ? b.data.last_message_time : b.data.last_message_time;
            return new Date(bTime || 0).getTime() - new Date(aTime || 0).getTime();
          });
        });

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
      
      // Update conversations list without reloading all conversations
      setUnifiedConversations(prev => {
        return prev.map(conv => {
          if (conv.type === 'group' && conv.data.group_id.toString() === groupId) {
            return {
              ...conv,
              data: {
                ...conv.data,
                last_message: message.content || '',
                last_message_time: message.timestamp,
              }
            };
          }
          return conv;
        }).sort((a, b) => {
          const aTime = a.type === 'private' ? a.data.last_message_time : a.data.last_message_time;
          const bTime = b.type === 'private' ? b.data.last_message_time : b.data.last_message_time;
          return new Date(bTime || 0).getTime() - new Date(aTime || 0).getTime();
        });
      });

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
  }, [user, selectedConversation]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes === 0 ? 'now' : `${diffInMinutes}m`;
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


  const handleConversationClick = (conversation: UnifiedConversation, event: React.MouseEvent) => {
    // Prevent the conversation selection if clicking on icon or name
    event.stopPropagation();
    
    if (conversation.type === 'private') {
      // Redirect to user profile
      router.push(`/profile?userId=${conversation.data.other_user_id}`);
    } else {
      // Redirect to group page
      router.push(`/groups/${conversation.data.group_id}/info`);
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
    <div className="flex flex-col pt-4">

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewConversationModal(true)}
                className="w-full justify-center"
              >
                New Chat
              </Button>
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
                  <AnimatePresence mode="popLayout">
                    {unifiedConversations.map((conversation, index) => {
                      const isSelected = selectedConversation?.type === conversation.type && 
                        (conversation.type === 'private' 
                          ? (selectedConversation.data as Conversation).other_user_id === (conversation.data as Conversation).other_user_id
                          : (selectedConversation.data as GroupConversation).group_id === (conversation.data as GroupConversation).group_id);
                      
                      return (
                        <motion.div
                          key={`${conversation.type}-${conversation.type === 'private' ? (conversation.data as Conversation).other_user_id : (conversation.data as GroupConversation).group_id}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.05,
                            layout: { duration: 0.4, ease: "easeInOut" }
                          }}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-accent'
                          }`}
                        >
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={(e) => handleConversationClick(conversation, e)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground text-base font-medium flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${
                              conversation.type === 'group' ? 'bg-secondary' : 'bg-primary'
                            }`}
                          >
                            {conversation.type === 'private' && conversation.data.other_user_avatar ? (
                              <img
                                src={conversation.data.other_user_avatar.startsWith('http') 
                                  ? conversation.data.other_user_avatar 
                                  : `http://localhost:8080${conversation.data.other_user_avatar}`}
                                alt={getDisplayName(conversation)}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium ${conversation.type === 'private' && conversation.data.other_user_avatar ? 'hidden' : ''}`}>
                              {getInitials(conversation)}
                            </div>
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
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
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
                  groupAvatar={selectedConversation.data.group_avatar}
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

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onUserSelect={handleStartNewConversation}
      />
    </div>
  );
}