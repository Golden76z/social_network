import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, UseWebSocketReturn } from '../hooks/useWebSockets';

const WebSocketContext = createContext<UseWebSocketReturn | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
  token?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url, token }) => {
  const webSocket = useWebSocket({ url, token });

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): UseWebSocketReturn => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocketContext must be used within WebSocketProvider');
  return context;
};
