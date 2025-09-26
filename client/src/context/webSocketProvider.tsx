import React, { createContext, useContext, ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { useWebSocket, UseWebSocketReturn } from '../lib/hooks/useWebSockets';
import { apiClient } from '../lib/api';
import { useAuth } from './AuthProvider';

const WebSocketContext = createContext<UseWebSocketReturn | null>(null);

type WindowWithWs = Window & {
  __wsEnsureConnected?: () => void;
};

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
  const [wsToken, setWsToken] = useState<string | undefined>();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const requestTokenRef = useRef<(() => Promise<void>) | null>(null);
  const fetchInFlightRef = useRef(false);
  const authStateRef = useRef({ isAuthenticated, userId });

  useEffect(() => {
    authStateRef.current = { isAuthenticated, userId };
  }, [isAuthenticated, userId]);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((expiresAt?: string) => {
    clearRefreshTimer();

    if (!expiresAt) return;

    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();
    const refreshIn = Math.max(30_000, expiry - now - 60_000); // Refresh 1 minute before expiry, minimum 30 seconds

    refreshTimerRef.current = setTimeout(() => {
      const { isAuthenticated: auth, userId: id } = authStateRef.current;
      if (!auth || !id) return;
      requestTokenRef.current?.();
    }, refreshIn);
  }, [clearRefreshTimer]);

  const requestToken = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setWsToken(undefined);
      clearRefreshTimer();
      return;
    }

    if (fetchInFlightRef.current) {
      return;
    }

    fetchInFlightRef.current = true;
    try {
      const response = await apiClient.get<{ token: string; expires_at?: string }>('/api/ws/token');
      setWsToken(response.token);
      scheduleRefresh(response.expires_at);
    } catch (error) {
      console.error('[API] Failed to fetch websocket token:', error);
      setWsToken(undefined);
      clearRefreshTimer();

      const { isAuthenticated: auth, userId: id } = authStateRef.current;
      if (auth && id) {
        refreshTimerRef.current = setTimeout(() => {
          const { isAuthenticated: stillAuth, userId: stillId } = authStateRef.current;
          if (!stillAuth || !stillId) return;
          requestTokenRef.current?.();
        }, 10_000); // Increased retry delay
      }
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [isAuthenticated, userId, scheduleRefresh, clearRefreshTimer]);

  useEffect(() => {
    requestTokenRef.current = requestToken;
    return () => {
      if (requestTokenRef.current === requestToken) {
        requestTokenRef.current = null;
      }
    };
  }, [requestToken]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setWsToken(undefined);
      clearRefreshTimer();
      fetchInFlightRef.current = false;
      return;
    }

    if (!wsToken && !fetchInFlightRef.current) {
      void requestToken();
    }
  }, [isAuthenticated, userId, wsToken, requestToken, clearRefreshTimer]);

  useEffect(() => {
    return () => {
      clearRefreshTimer();
    };
  }, [clearRefreshTimer]);

  // Only create WebSocket connection when we have a valid token and user is authenticated
  const webSocket = useWebSocket({ 
    url, 
    token: isAuthenticated && wsToken ? wsToken : undefined 
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserWindow = window as WindowWithWs;
      browserWindow.__wsEnsureConnected = () => {
        if (webSocket.connectionStatus !== 'connected') {
          webSocket.reconnect();
        }
      };
      // Expose WebSocket context for API client to check connection status
      (browserWindow as any).__wsContext = webSocket;
    }

    return () => {
      if (typeof window !== 'undefined') {
        const browserWindow = window as WindowWithWs;
        if (browserWindow.__wsEnsureConnected) {
          delete browserWindow.__wsEnsureConnected;
        }
        if ((browserWindow as any).__wsContext) {
          delete (browserWindow as any).__wsContext;
        }
      }
    };
  }, [webSocket]);

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
