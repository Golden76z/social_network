"use client"

import { FormEvent, JSX, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '../../context/webSocketProvider';

interface ChatMessage {
  id: string;
  username?: string;
  content?: string;
  timestamp: string;
}

export function ChatComponent(): JSX.Element {
  const { lastMessage, connectionStatus, onlineUsers, sendMessage } = useWebSocketContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessage?.type === 'chat' || lastMessage?.type === 'private_message') {
      setMessages(prev => [
        ...prev,
        {
          id: `${lastMessage.timestamp}-${lastMessage.user_id}`,
          username: lastMessage.username,
          content: lastMessage.content || '',
          timestamp: lastMessage.timestamp,
        },
      ]);
    }
  }, [lastMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (ev: FormEvent): void => {
    ev.preventDefault();
    if (!input.trim() || connectionStatus !== 'connected') return;
    sendMessage({ type: 'chat', content: input.trim() });
    setInput('');
  };

  return (
    <div className="flex h-full max-w-4xl mx-auto bg-white rounded shadow">
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chat</h2>
          <span className={`text-sm ${
            connectionStatus === 'connected' ? 'text-green-600' :
            connectionStatus === 'connecting' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {connectionStatus}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="space-y-1">
              <div className="flex justify-between text-gray-700 text-sm">
                <span className="font-medium">{msg.username}</span>
                <time className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</time>
              </div>
              <p className="bg-gray-100 rounded px-3 py-2">{msg.content}</p>
            </div>
          ))}
          <div ref={endRef} />
        </main>
        <footer className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={connectionStatus !== 'connected'}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || connectionStatus !== 'connected'}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            Send
          </button>
        </footer>
      </div>
      <aside className="w-64 border-l bg-gray-50 p-4">
        <h3 className="font-semibold mb-2">Online ({onlineUsers.length})</h3>
        <ul className="space-y-2">
          {onlineUsers.map(user => (
            <li key={user.id} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full block" />
              {user.username}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
