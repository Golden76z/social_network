"use client"

import { useEffect, useState, useRef } from 'react';
import { Conversation, PrivateMessage, ChatMessage } from '@/lib/types/chat';
import { chatAPI } from '@/lib/api/chat';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { EmojiPicker } from './EmojiPicker';

interface PrivateChatProps {
  conversation: Conversation;
  currentUserId: number;
}

export function PrivateChat({ conversation, currentUserId }: PrivateChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const { sendMessage: sendWebSocketMessage, lastMessage } = useWebSocketContext();

  useEffect(() => {
    loadMessages();
  }, [conversation.other_user_id]);

  useEffect(() => {
    if (lastMessage?.type === 'private_message') {
      console.log('🔍 PrivateChat received WebSocket message:', lastMessage);
      const messageData = lastMessage.data as any;
      const senderId = messageData?.sender_id || lastMessage.user_id;
      const receiverId = messageData?.receiver_id;
      
      console.log('🔍 Message data:', { senderId, receiverId, currentUserId, otherUserId: conversation.other_user_id });
      
      // Check if this message is for the current conversation
      if ((senderId === conversation.other_user_id && receiverId === currentUserId) ||
          (senderId === currentUserId && receiverId === conversation.other_user_id)) {
        console.log('🔍 Message is for this conversation, adding to messages');
        const newMessage: ChatMessage = {
          id: `${lastMessage.timestamp}-${lastMessage.user_id}`,
          username: lastMessage.username,
          content: lastMessage.content || '',
          timestamp: lastMessage.timestamp,
          isOwn: lastMessage.user_id === currentUserId,
        };
        setMessages(prev => [...prev, newMessage]);
      } else {
        console.log('🔍 Message is not for this conversation, ignoring');
      }
    }
  }, [lastMessage, currentUserId, conversation.other_user_id]);



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
        // First load - replace messages
        setMessages(chatMessages.reverse());
      } else {
        // Load more - prepend to existing messages
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
    if (!input.trim() || sending) return;

    const messageContent = input.trim();
    console.log('📤 Sending message:', messageContent, 'to user:', conversation.other_user_id);
    setInput('');
    setSending(true);

    try {
      // Send via API
      console.log('📤 Calling chatAPI.sendMessage...');
      await chatAPI.sendMessage({
        receiver_id: conversation.other_user_id,
        body: messageContent,
      });
      console.log('📤 chatAPI.sendMessage completed successfully');

      // Send via WebSocket for real-time delivery
      console.log('📤 Sending via WebSocket...');
      sendWebSocketMessage({
        type: 'private_message',
        content: messageContent,
        data: {
          receiver_id: conversation.other_user_id,
        },
      });
      console.log('📤 WebSocket message sent');

      // Add message to local state immediately
      const newMessage: ChatMessage = {
        id: `${Date.now()}-${currentUserId}`,
        username: 'You',
        content: messageContent,
        timestamp: new Date().toISOString(),
        isOwn: true,
      };
      setMessages(prev => [...prev, newMessage]);

    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setInput(messageContent); // Restore input on error
    } finally {
      setSending(false);
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {conversation.other_user_avatar ? (
              <img
                src={conversation.other_user_avatar}
                alt={getDisplayName()}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials()
            )}
          </div>
          <div>
            <h2 className="font-semibold">{getDisplayName()}</h2>
            <p className="text-sm text-gray-500">
              {conversation.other_user_is_private ? 'Private' : 'Public'} profile
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto p-4 space-y-4" style={{ height: '500px' }}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Load More Button */}
        {hasMoreMessages && !loading && (
          <div className="text-center" ref={messagesTopRef}>
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load More Messages'}
            </button>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white relative">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
              maxLength={1000}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-1">
          {input.length}/1000 characters
        </div>
      </div>
    </div>
  );
}
