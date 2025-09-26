import { useEffect, useRef, useState, useCallback } from 'react';

// Global WebSocket connection manager to prevent multiple instances
let globalWebSocketInstance: WebSocket | null = null;
let globalConnectionCount = 0;

export interface WebSocketMessage {
  type: string;
  content?: string;
  group_id?: string;
  user_id: number;
  username: string;
  timestamp: string;
  message_id?: number | string; // Allow both number and string to handle int64 from Go
  data?: unknown;
}

export interface WebSocketUser {
  id: number;
  username: string;
}

export interface UseWebSocketOptions {
  url: string;
  token?: string;
  reconnectAttempts?: number;
  reconnectIntervalMS?: number;
  heartbeatIntervalMS?: number;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: Partial<WebSocketMessage>) => void;
  sendJson: (msg: unknown) => void;
  onlineUsers: WebSocketUser[];
  reconnect: () => void;
}

export function useWebSocket({
  url,
  token,
  reconnectAttempts = 5, // Limit reconnection attempts
  reconnectIntervalMS = 5000, // Increased from 3000 to 5000ms
  heartbeatIntervalMS = 30000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<UseWebSocketReturn['connectionStatus']>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<WebSocketUser[]>([]);
  const reconnectCount = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldReconnect = useRef(true);
  const lastTokenRef = useRef<string | undefined>(token);

  const resolveToken = useCallback((): string | undefined => {
    if (token) {
      lastTokenRef.current = token;
      return token;
    }

    if (token === undefined) {
      lastTokenRef.current = undefined;
    }

    return lastTokenRef.current;
  }, [token]);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Prevent multiple connections if already connected
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setConnectionStatus('connected');
      return;
    }

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    const authToken = resolveToken();

    if (!authToken) {
      setConnectionStatus('disconnected');
      if (shouldReconnect.current && reconnectCount.current < reconnectAttempts) {
        reconnectTimeout.current = setTimeout(() => {
          if (shouldReconnect.current) {
            connect();
          }
        }, reconnectIntervalMS);
      }
      return;
    }

    const existingSocket = socketRef.current;
    if (existingSocket) {
      const sameToken = lastTokenRef.current === authToken;
      const { readyState } = existingSocket;

      // Only reuse if same token AND connection is stable
      if (sameToken && readyState === WebSocket.OPEN) {
        setConnectionStatus('connected');
        setSocket(existingSocket);
        reconnectCount.current = 0;
        return;
      }

      // Close existing connection gracefully
      shouldReconnect.current = false;
      try {
        if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) {
          existingSocket.close(1000, 'Creating new connection');
        }
      } catch (closeError) {
        console.error('[API] Failed to close existing WebSocket:', closeError);
      }
      socketRef.current = null;
      setSocket(null);
      
      // Wait for connection to fully close before reconnecting
      // Firefox-specific: Longer delay to prevent connection churn
      const isFirefox = typeof window !== 'undefined' && /Firefox/.test(navigator.userAgent);
      const reconnectDelay = isFirefox ? 3000 : 1500;
      
      setTimeout(() => {
        shouldReconnect.current = true;
        connect();
      }, reconnectDelay);
      return;
    }

    setConnectionStatus('connecting');

    // Check if there's already a global WebSocket instance
    if (globalWebSocketInstance && globalWebSocketInstance.readyState === WebSocket.OPEN) {
      socketRef.current = globalWebSocketInstance;
      setSocket(globalWebSocketInstance);
      setConnectionStatus('connected');
      globalConnectionCount++;
      return;
    }

    // Create WebSocket URL with token as query parameter (backend expects this)
    const wsUrl = new URL(url);
    wsUrl.searchParams.append('token', authToken);
    const ws = new WebSocket(wsUrl.toString());
    socketRef.current = ws;
    globalWebSocketInstance = ws;
    globalConnectionCount++;
    shouldReconnect.current = true;

    ws.onopen = (): void => {
      setConnectionStatus('connected');
      setSocket(ws);
      reconnectCount.current = 0;

      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        const heartbeatToken = lastTokenRef.current;
        if (ws.readyState === WebSocket.OPEN && heartbeatToken) {
          ws.send(JSON.stringify({ 
            type: 'ping', 
            timestamp: new Date().toISOString(),
            data: heartbeatToken // Include JWT token in ping message
          }));
        }
      }, heartbeatIntervalMS);
    };

    ws.onmessage = (ev): void => {
      try {
        const msg = JSON.parse(ev.data) as WebSocketMessage;
        
        // Firefox-specific: Add small delay to ensure proper message processing
        const isFirefox = typeof window !== 'undefined' && /Firefox/.test(navigator.userAgent);
        if (isFirefox) {
          // Small delay to ensure Firefox processes the message properly
          setTimeout(() => {
            setLastMessage(msg);
          }, 10);
        } else {
          setLastMessage(msg);
        }

        if (msg.type === 'user_list' && Array.isArray(msg.data)) {
          setOnlineUsers(msg.data as WebSocketUser[]);
        }
      } catch (err) {
        console.error('[API] Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = (ev): void => {
      // Handle different close codes
      if (ev.code === 1011) {
      } else if (ev.code === 1000) {
        // Don't reconnect on normal closure unless we're still supposed to be connected
        if (!shouldReconnect.current) {
          return;
        }
      } else if (ev.code === 1006) {
      } else if (ev.code >= 4000) {
      }
      
      setConnectionStatus('disconnected');
      setSocket(null);
      socketRef.current = null;
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      setOnlineUsers([]);

      // Clear global instance if this was the global connection
      if (globalWebSocketInstance === ws) {
        globalWebSocketInstance = null;
        globalConnectionCount = 0;
      }

      // Always attempt reconnection for abnormal closures (1006) and errors
      if (ev.code === 1006 || ev.code === 1011 || ev.code >= 4000) {
        if (reconnectCount.current < reconnectAttempts) {
          // Add minimum delay for page load interruptions
          const baseDelay = ev.code === 1006 ? 2000 : reconnectIntervalMS;
          const delay = baseDelay * 1.5 ** reconnectCount.current;
          reconnectTimeout.current = setTimeout(() => {
            if (!shouldReconnect.current) {
              return;
            }
            reconnectCount.current += 1;
            connect();
          }, delay);
        }
      }
    };

    ws.onerror = (event): void => {
      console.error('[API] WebSocket error occurred:', event);
      setConnectionStatus('error');
      if (shouldReconnect.current) {
        try {
          ws.close();
        } catch (closeError) {
          console.error('[API] Failed to close errored WebSocket:', closeError);
        }
      }
    };
  }, [url, resolveToken, reconnectAttempts, reconnectIntervalMS, heartbeatIntervalMS]);

  const sendMessage = useCallback(
    (message: Partial<WebSocketMessage>) => {
      if (socket?.readyState === WebSocket.OPEN) {
        const msg = { ...message, timestamp: new Date().toISOString() };
        socket.send(JSON.stringify(msg));
      } else {
        console.error('[API] WebSocket not ready, message not sent:', socket?.readyState);
      }
    },
    [socket]
  );

  const sendJson = useCallback(
    (msg: unknown) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
      }
    },
    [socket]
  );

  const reconnect = useCallback(() => {
    shouldReconnect.current = true;
    socketRef.current?.close();
    reconnectCount.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      // Only disable reconnection if this is the last hook instance
      globalConnectionCount--;
      if (globalConnectionCount <= 0) {
        shouldReconnect.current = false;
      }
      
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      
      // Only close the global WebSocket if this is the last connection
      if (globalConnectionCount <= 0 && globalWebSocketInstance) {
        globalWebSocketInstance.close(1000, 'Last connection unmounting');
        globalWebSocketInstance = null;
        globalConnectionCount = 0;
      }
      
      socketRef.current = null;
      setSocket(null);
    };
  }, [connect]);

  return { socket, lastMessage, connectionStatus, sendMessage, sendJson, onlineUsers, reconnect };
}
