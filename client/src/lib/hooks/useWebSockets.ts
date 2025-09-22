import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  user_id?: number;
  username?: string;
  content?: string;
  data?: unknown;
  timestamp: string;
  room_id?: string;
  group_id?: string;
  GroupID?: string;
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
  reconnectAttempts = 5,
  reconnectIntervalMS = 3000,
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

  const connect = useCallback(() => {
    if (!token) {
      console.log('🔌 WebSocket: No token provided, skipping connection');
      setConnectionStatus('disconnected');
      return;
    }

    console.log('🔌 WebSocket connect called with token: Present');
    setConnectionStatus('connecting');
    const wsUrl = new URL(url);
    wsUrl.searchParams.append('token', token);

    console.log('🔌 Connecting to WebSocket URL:', wsUrl.toString());
    const ws = new WebSocket(wsUrl.toString());
    socketRef.current = ws;

    ws.onopen = (): void => {
      console.log('🔌 WebSocket connected successfully');
      setConnectionStatus('connected');
      setSocket(ws);
      reconnectCount.current = 0;

      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && token) {
          ws.send(JSON.stringify({ 
            type: 'ping', 
            timestamp: new Date().toISOString(),
            data: token // Include JWT token in ping message
          }));
        }
      }, heartbeatIntervalMS);
    };

    ws.onmessage = (ev): void => {
      try {
        const msg = JSON.parse(ev.data) as WebSocketMessage;
        console.log('🔌 WebSocket received message:', msg);
        setLastMessage(msg);

        if (msg.type === 'user_list' && Array.isArray(msg.data)) {
          setOnlineUsers(msg.data as WebSocketUser[]);
        }
      } catch (err) {
        console.error('🔌 Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = (ev): void => {
      console.log('🔌 WebSocket closed with code:', ev.code, 'reason:', ev.reason);
      setConnectionStatus('disconnected');
      setSocket(null);
      socketRef.current = null;
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

      if (ev.code !== 1000 && reconnectCount.current < reconnectAttempts) {
        const delay = reconnectIntervalMS * 1.5 ** reconnectCount.current;
        console.log('🔌 Attempting to reconnect in', delay, 'ms (attempt', reconnectCount.current + 1, ')');
        reconnectTimeout.current = setTimeout(() => {
          reconnectCount.current += 1;
          connect();
        }, delay);
      }
    };

    ws.onerror = (): void => {
      console.error('🔌 WebSocket error occurred');
      setConnectionStatus('error');
    };
  }, [url, token, reconnectAttempts, reconnectIntervalMS, heartbeatIntervalMS]);

  const sendMessage = useCallback(
    (message: Partial<WebSocketMessage>) => {
      if (socket?.readyState === WebSocket.OPEN) {
        const msg = { ...message, timestamp: new Date().toISOString() };
        console.log('🔌 Sending WebSocket message:', msg);
        socket.send(JSON.stringify(msg));
      } else {
        console.log('🔌 WebSocket not ready, message not sent:', message);
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
    socketRef.current?.close();
    reconnectCount.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      socketRef.current?.close(1000, 'Unmounting');
    };
  }, [connect]);

  return { socket, lastMessage, connectionStatus, sendMessage, sendJson, onlineUsers, reconnect };
}