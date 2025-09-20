import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useWebSocket, UseWebSocketReturn } from '../lib/hooks/useWebSockets';
import { apiClient } from '../lib/api';
import { useAuth } from './AuthProvider';

const WebSocketContext = createContext<UseWebSocketReturn | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
  const [token, setToken] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Only get token when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const jwtToken = apiClient.getToken();
      console.log('🔌 WebSocket token set for authenticated user:', jwtToken ? 'Present' : 'Missing');
      setToken(jwtToken);
    } else {
      console.log('🔌 WebSocket: User not authenticated, clearing token');
      setToken(null);
    }
  }, [isAuthenticated, user]);

  // Only create WebSocket connection when we have a valid token
  const webSocket = useWebSocket({ url, token: isAuthenticated ? token : null });

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
