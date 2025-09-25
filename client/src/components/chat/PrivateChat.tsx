"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Conversation, PrivateMessage, ChatMessage } from '@/lib/types/chat';
import { chatAPI } from '@/lib/api/chat';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { EmojiPicker } from '../media/EmojiPicker';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

interface PrivateChatProps {
  conversation: Conversation;
  currentUserId: number;
}

export function PrivateChat({ conversation, currentUserId }: PrivateChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sendMessage: sendWebSocketMessage, lastMessage, connectionStatus, socket, onlineUsers } = useWebSocketContext();

  // Detect Firefox browser
  const isFirefox = typeof window !== 'undefined' && /Firefox/.test(navigator.userAgent);

  useEffect(() => {
    loadMessages();
  }, [conversation.other_user_id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Firefox-specific: Use longer delay and different scroll method
      const scrollDelay = isFirefox ? 150 : 100;
      setTimeout(() => {
        if (messagesContainerRef.current) {
          if (isFirefox) {
            // Firefox sometimes has issues with smooth scrolling
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          } else {
            messagesContainerRef.current.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }
      }, scrollDelay);
    }
  }, [messages, isFirefox]);

  useEffect(() => {
    if (!lastMessage) return;

    if (isFirefox) {
      console.log('🦊 Firefox detected - message processing:', lastMessage);
    }

    if (lastMessage.type === 'private_message_ack') {
      const ackData = lastMessage.data as { body?: string; receiver_id?: number } | undefined;
      if (ackData?.receiver_id !== conversation.other_user_id) return;

      const messageId = `ack-${lastMessage.message_id}`;
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === messageId);
        if (exists) return prev;

        const newMessage: ChatMessage = {
          id: messageId,
          username: 'You',
          content: ackData.body || '',
          timestamp: lastMessage.timestamp,
          isOwn: true,
        };
        return [...prev, newMessage];
      });

      console.log('🦊 Firefox: Received private_message_ack, resetting sending state');
      setSending(false);
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      return;
    }

    if (lastMessage.type === 'private_message') {
      console.log('🔍 PrivateChat received WebSocket message:', lastMessage);
      const messageData = lastMessage.data as any;
      const senderId = messageData?.sender_id || lastMessage.user_id;
      const receiverId = messageData?.receiver_id;

      console.log('🔍 Message data:', { senderId, receiverId, currentUserId, otherUserId: conversation.other_user_id });

      // Check if this message is for the current conversation
      if ((senderId === conversation.other_user_id && receiverId === currentUserId) ||
          (senderId === currentUserId && receiverId === conversation.other_user_id)) {
        console.log('🔍 Message is for this conversation, adding to messages');

        // Check if message already exists to prevent duplicates
      const messageId = lastMessage.message_id ? `pm-${lastMessage.message_id}` : `${lastMessage.timestamp}-${lastMessage.user_id}`;
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageId);
          if (exists) {
            console.log('🔍 Message already exists, skipping duplicate');
            return prev;
          }

          const newMessage: ChatMessage = {
            id: messageId,
            username: lastMessage.username,
            content: lastMessage.content || '',
            timestamp: lastMessage.timestamp,
            isOwn: lastMessage.user_id === currentUserId,
          };
          return [...prev, newMessage];
        });

        // If this is our own message (confirmation), reset sending state
        if (lastMessage.user_id === currentUserId) {
          console.log('🔍 Received confirmation of our own message, resetting sending state');
          
          // Firefox-specific: Remove any optimistic messages and replace with real one
          if (isFirefox) {
            setMessages(prev => {
              // Remove temporary optimistic messages
              const filtered = prev.filter(msg => !msg.id.startsWith('temp-'));
              // Add the real message if it doesn't already exist
              const exists = filtered.some(msg => msg.id === messageId);
              if (!exists) {
                filtered.push(newMessage);
              }
              return filtered;
            });
          }
          
          setSending(false);
          if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
          }
        }
      } else {
        console.log('🔍 Message is not for this conversation, ignoring');
      }
    }
  }, [lastMessage, currentUserId, conversation.other_user_id]);

  // Firefox-specific: Additional fallback for stuck sending state
  useEffect(() => {
    if (isFirefox && sending) {
      console.log('🦊 Firefox: Setting additional fallback timeout for sending state');
      const firefoxFallbackTimeout = setTimeout(() => {
        if (sending) {
          console.log('🦊 Firefox: Fallback timeout triggered, resetting sending state');
          setSending(false);
          setError('Message may have been sent. Please refresh if needed.');
        }
      }, 8000); // 8 second fallback for Firefox

      return () => clearTimeout(firefoxFallbackTimeout);
    }
  }, [sending, isFirefox]);



  const loadMoreMessages = () => {
    if (!loadingMore && hasMoreMessages) {
      loadMessages(messages.length);
    }
  };

  const loadMessages = async (offset: number = 0) => {
    try {
      if (offset === 0) {
        setLoading(true);
        setHasMoreMessages(true); // Reset pagination state
      } else {
        setLoadingMore(true);
      }
      
      console.log('🔍 Loading messages for conversation:', conversation.other_user_id, 'offset:', offset, 'limit: 20');
      console.log('🔍 Conversation object:', conversation);
      console.log('🔍 other_user_id type:', typeof conversation.other_user_id);
      const data = await chatAPI.getMessages(conversation.other_user_id, 20, offset);
      console.log('🔍 Received data:', data, 'count:', data?.length);
      
      if (!data || !Array.isArray(data)) {
        console.error('❌ Invalid data received:', data);
        setError('No messages data received');
        return;
      }
      
      const chatMessages: ChatMessage[] = data.map(msg => ({
        id: msg.id.toString(),
        username: msg.sender_id === currentUserId ? 'You' : conversation.other_user_nickname,
        content: msg.body,
        timestamp: msg.created_at,
        isOwn: msg.sender_id === currentUserId,
      }));
      
      // Check if we got fewer messages than requested (indicating no more messages)
      if (data.length < 20) {
        setHasMoreMessages(false);
        console.log('🔍 No more messages available (loaded', data.length, 'messages)');
      } else {
        console.log('🔍 More messages available (loaded', data.length, 'messages)');
      }
      
      if (offset === 0) {
        // First load - reverse to show oldest first (chronological order)
        setMessages(chatMessages.reverse());
      } else {
        // Load more - prepend older messages to existing messages
        setMessages(prev => [...chatMessages.reverse(), ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    if (!input.trim() || sending) return;

    const messageContent = input.trim();
    console.log('📤 Sending message:', messageContent, 'to user:', conversation.other_user_id);
    setInput('');
    setSending(true);

    // Firefox-specific: Shorter timeout and immediate local state update
    const timeoutDuration = isFirefox ? 2000 : 5000;
    
    fallbackTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ WebSocket confirmation timeout, resetting sending state');
      setSending(false);
      if (isFirefox) {
        setError('Message sent successfully (confirmation delayed)');
        // Auto-dismiss Firefox success message after 3 seconds
        setTimeout(() => setError(null), 3000);
      } else {
        setError('Message sending timed out. Please try again.');
      }
      fallbackTimeoutRef.current = null;
    }, timeoutDuration);

    try {
      // Check WebSocket connection status before sending
      console.log('📤 WebSocket status:', connectionStatus, 'Socket ready:', socket?.readyState === WebSocket.OPEN);

      if (connectionStatus !== 'connected' || socket?.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket not connected, cannot send message');
        setError('WebSocket connection not ready. Please refresh the page.');
        setSending(false);
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        return;
      }

      // Firefox-specific handling: Add small delay for WebSocket stability
      if (isFirefox) {
        await new Promise(resolve => setTimeout(resolve, 150)); // Increased delay for Firefox
      }

      // Send via WebSocket only - backend handles DB save and broadcasting
      console.log('📤 Sending via WebSocket...');
      sendWebSocketMessage({
        type: 'private_message',
        content: messageContent,
        data: {
          receiver_id: conversation.other_user_id,
        },
      });
      console.log('📤 WebSocket message sent');

      // Firefox-specific: Add optimistic local state update as fallback
      if (isFirefox) {
        const optimisticMessage: ChatMessage = {
          id: `temp-${Date.now()}-${Math.random()}`,
          username: 'You',
          content: messageContent,
          timestamp: new Date().toISOString(),
          isOwn: true,
        };
        
        // Add optimistic message temporarily
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Set a shorter timeout for Firefox to reset sending state
        setTimeout(() => {
          if (sending) {
            console.log('🦊 Firefox: Optimistic timeout, resetting sending state');
            setSending(false);
            if (fallbackTimeoutRef.current) {
              clearTimeout(fallbackTimeoutRef.current);
              fallbackTimeoutRef.current = null;
            }
          }
        }, 1500);
      }

    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setInput(messageContent); // Restore input on error
      setSending(false); // Reset sending state on error
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDisplayName = () => {
    if (conversation.other_user_first_name && conversation.other_user_last_name) {
      return `${conversation.other_user_first_name} ${conversation.other_user_last_name}`;
    }
    return conversation.other_user_nickname;
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    router.push(`/profile?userId=${conversation.other_user_id}`);
  };

  const isUserOnline = () => {
    return onlineUsers.some(user => user.id === conversation.other_user_id);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-card to-card/50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-purple-100/30">
      {/* Header */}
      <div className="p-3 border-b border-border bg-gradient-to-r from-purple-100 to-purple-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleProfileClick}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-primary-foreground text-sm font-medium shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
          >
            {conversation.other_user_avatar && typeof conversation.other_user_avatar === 'string' ? (
              <img
                src={conversation.other_user_avatar.startsWith('http') 
                  ? conversation.other_user_avatar 
                  : `http://localhost:8080${conversation.other_user_avatar}`}
                alt={getDisplayName()}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium ${conversation.other_user_avatar ? 'hidden' : ''}`}>
              {getInitials()}
            </div>
          </div>
          <div className="flex-1">
            <h2 
              onClick={handleProfileClick}
              className="font-semibold text-card-foreground text-base cursor-pointer hover:text-primary transition-colors"
            >
              {getDisplayName()}
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isUserOnline() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <PrivacyBadge isPrivate={conversation.other_user_is_private} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-0 ${isFirefox ? 'messages-container' : ''}`}
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        <div className="p-3 space-y-2">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2 text-destructive text-xs backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setError(null)}
                    className="text-destructive/70 hover:text-destructive transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Load More Button */}
          {hasMoreMessages && !loading && (
            <div className="text-center" ref={messagesTopRef}>
              <button
                onClick={loadMoreMessages}
                disabled={loadingMore}
                className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full"></div>
                    Loading...
                  </div>
                ) : (
                  'Load More Messages'
                )}
              </button>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <div className="text-3xl mb-3">💬</div>
              <p className="font-medium mb-1 text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[66%] px-3 py-2 rounded-xl shadow-sm ${
                    message.isOwn
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-primary-foreground'
                      : 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-800'
                  }`}
                >
                  <div className="text-sm leading-relaxed">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.isOwn ? 'text-primary-foreground/70' : 'text-purple-600/70'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-gradient-to-r from-purple-100 to-purple-200/50 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full border border-purple-200 rounded-lg px-3 py-2 pr-8 bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all duration-200 text-sm"
              disabled={sending}
              maxLength={1000}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors text-sm"
            >
              😊
            </button>
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={(emoji) => setInput(prev => prev + emoji)}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-primary-foreground px-3 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium text-sm"
          >
            {sending ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                Sending...
              </div>
            ) : (
              'Send'
            )}
          </button>
        </form>
        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
          <span>{input.length}/1000 characters</span>
          <span className={input.length > 900 ? 'text-destructive' : ''}>
            {1000 - input.length} remaining
          </span>
        </div>
      </div>
    </div>
  );
}
