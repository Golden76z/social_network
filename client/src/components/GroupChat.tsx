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
  const { sendMessage: sendWebSocketMessage, lastMessage } = useWebSocketContext();

  useEffect(() => {
    loadMessages();
  }, [groupId]);

  useEffect(() => {
    if (lastMessage?.type === 'group_message') {
      console.log('🔍 GroupChat received WebSocket message:', lastMessage);
      const messageGroupId = lastMessage.group_id || (lastMessage as any).GroupID;
      
      console.log('🔍 Message group ID:', messageGroupId, 'Current group ID:', groupId);
      
      // Check if this message is for the current group
      if (messageGroupId === groupId.toString()) {
        console.log('🔍 Message is for this group, adding to messages');
        const newMessage: ChatMessage = {
          id: `${lastMessage.timestamp}-${lastMessage.user_id}`,
          username: lastMessage.username,
          content: lastMessage.content || '',
          timestamp: lastMessage.timestamp,
          isOwn: lastMessage.user_id === currentUserId,
          groupId: groupId.toString(),
        };
        setMessages(prev => [...prev, newMessage]);
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
        // First load - replace messages
        setMessages(chatMessages.reverse());
      } else {
        // Load more - prepend to existing messages
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

    try {
      // Send via API
      console.log('📤 Calling chatAPI.sendGroupMessage...');
      await chatAPI.sendGroupMessage({
        group_id: groupId,
        body: messageContent,
      });
      console.log('📤 chatAPI.sendGroupMessage completed successfully');

      // Send via WebSocket for real-time delivery
      console.log('📤 Sending via WebSocket...');
      sendWebSocketMessage({
        type: 'group_message',
        content: messageContent,
        group_id: groupId.toString(),
      });
      console.log('📤 WebSocket group message sent');

      // Add message to local state immediately
      const newMessage: ChatMessage = {
        id: `${Date.now()}-${currentUserId}`,
        username: 'You',
        content: messageContent,
        timestamp: new Date().toISOString(),
        isOwn: true,
        groupId: groupId.toString(),
      };
      setMessages(prev => [...prev, newMessage]);

    } catch (err) {
      console.error('❌ Failed to send group message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send group message');
      setInput(messageContent); // Restore input on error
    } finally {
      setSending(false);
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
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading group messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
            {getInitials()}
          </div>
          <div>
            <h2 className="font-semibold">{groupName}</h2>
            <p className="text-sm text-gray-500">Group chat</p>
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
            <p className="text-sm mt-1">Start the group conversation!</p>
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
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {!message.isOwn && (
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {message.username}
                  </div>
                )}
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.isOwn ? 'text-green-100' : 'text-gray-500'
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
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

