"use client"

import { useEffect, useState, useRef } from 'react';
import { GroupMessage, ChatMessage } from '@/lib/types/chat';
import { chatAPI } from '@/lib/api/chat';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { EmojiPicker } from './EmojiPicker';

interface GroupChatProps {
  groupId: number;
  groupName: string;
  currentUserId: number;
}

export function GroupChat({ groupId, groupName, currentUserId }: GroupChatProps) {
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
  const { sendMessage: sendWebSocketMessage, lastMessage, connectionStatus, socket } = useWebSocketContext();

  useEffect(() => {
    loadMessages();
  }, [groupId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'group_message_ack') {
      if (lastMessage.group_id !== groupId.toString()) return;

      const ackData = lastMessage.data as { body?: string } | undefined;
      const messageId = `group-ack-${lastMessage.message_id}`;
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === messageId);
        if (exists) return prev;

        const newMessage: ChatMessage = {
          id: messageId,
          username: 'You',
          content: ackData?.body || '',
          timestamp: lastMessage.timestamp,
          isOwn: true,
          groupId: groupId.toString(),
        };
        return [...prev, newMessage];
      });

      setSending(false);
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      return;
    }

    if (lastMessage.type === 'group_message') {
      console.log('🔍 GroupChat received WebSocket message:', lastMessage);
      const messageGroupId = lastMessage.group_id || (lastMessage as any).GroupID;

      console.log('🔍 Message group ID:', messageGroupId, 'Current group ID:', groupId);

      // Check if this message is for the current group
      if (messageGroupId === groupId.toString()) {
        console.log('🔍 Message is for this group, adding to messages');

        // Check if message already exists to prevent duplicates
        const messageId = lastMessage.message_id ? `group-${lastMessage.message_id}` : `${lastMessage.timestamp}-${lastMessage.user_id}`;
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageId);
          if (exists) {
            console.log('🔍 Group message already exists, skipping duplicate');
            return prev;
          }

          const newMessage: ChatMessage = {
            id: messageId,
            username: lastMessage.username,
            content: lastMessage.content || '',
            timestamp: lastMessage.timestamp,
            isOwn: lastMessage.user_id === currentUserId,
            groupId: groupId.toString(),
          };
          return [...prev, newMessage];
        });

        // If this is our own message (confirmation), reset sending state
        if (lastMessage.user_id === currentUserId) {
          console.log('🔍 Received confirmation of our own group message, resetting sending state');
          setSending(false);
          if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
          }
        }
      } else {
        console.log('🔍 Message is not for this group, ignoring');
      }
    }
  }, [lastMessage, currentUserId, groupId]);



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
      
      console.log('🔍 Loading group messages for group:', groupId, 'offset:', offset, 'limit: 20');
      const data = await chatAPI.getGroupMessages(groupId, 20, offset);
      console.log('🔍 Received group messages data:', data, 'count:', data?.length);
      
      if (!data || !Array.isArray(data)) {
        console.error('❌ Invalid group messages data received:', data);
        setError('No group messages data received');
        return;
      }
      
      const chatMessages: ChatMessage[] = data.map(msg => ({
        id: msg.id.toString(),
        username: msg.sender_id === currentUserId ? 'You' : `User ${msg.sender_id}`, // TODO: Get actual username
        content: msg.body,
        timestamp: msg.created_at,
        isOwn: msg.sender_id === currentUserId,
        groupId: groupId.toString(),
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
      setError(err instanceof Error ? err.message : 'Failed to load group messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const messageContent = input.trim();
    console.log('📤 Sending group message:', messageContent, 'to group:', groupId);
    setInput('');
    setSending(true);

    // Fallback timeout in case WebSocket confirmation doesn't come back
    fallbackTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ WebSocket confirmation timeout, resetting sending state');
      setSending(false);
      fallbackTimeoutRef.current = null;
    }, 10000); // 10 second timeout

    try {
      // Check WebSocket connection status before sending
      console.log('📤 WebSocket status:', connectionStatus, 'Socket ready:', socket?.readyState === WebSocket.OPEN);

      if (connectionStatus !== 'connected' || socket?.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket not connected, cannot send group message');
        setError('WebSocket connection not ready. Please refresh the page.');
        setSending(false);
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        return;
      }

      // Send via WebSocket only - backend handles DB save and broadcasting
      console.log('📤 Sending group message via WebSocket...');
      sendWebSocketMessage({
        type: 'group_message',
        content: messageContent,
        group_id: groupId.toString(),
      });
      console.log('📤 WebSocket group message sent');

      // Don't add to local state - wait for WebSocket confirmation
      // The backend will send the message back to us via WebSocket

    } catch (err) {
      console.error('❌ Failed to send group message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send group message');
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

  const getInitials = () => {
    return groupName.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100/30">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading group messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-purple-100/30">
      {/* Header */}
      <div className="p-3 border-b border-border bg-gradient-to-r from-purple-100 to-purple-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-primary-foreground text-xs font-medium shadow-sm">
            {getInitials()}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-card-foreground text-base">{groupName}</h2>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <p className="text-xs text-muted-foreground">Group chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-0"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        <div className="p-3 space-y-2">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2 text-destructive text-xs backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-2 text-destructive/70 hover:text-destructive transition-colors"
                >
                  ✕
                </button>
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
              <p className="text-xs">Start the group conversation!</p>
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
                  {!message.isOwn && (
                    <div className="text-xs font-medium text-purple-600 mb-1">
                      {message.username}
                    </div>
                  )}
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
