import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  user_id?: number;
  username?: string;
  content?: string;
  data?: unknown;
  timestamp: string;
  room_id?: string;
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
    setConnectionStatus('connecting');
    const wsUrl = new URL(url);
    if (token) wsUrl.searchParams.append('token', token);

    const ws = new WebSocket(wsUrl.toString());
    socketRef.current = ws;

    ws.onopen = (): void => {
      setConnectionStatus('connected');
      setSocket(ws);
      reconnectCount.current = 0;

      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        }
      }, heartbeatIntervalMS);
    };

    ws.onmessage = (ev): void => {
      try {
        const msg = JSON.parse(ev.data) as WebSocketMessage;
        setLastMessage(msg);

        if (msg.type === 'user_list' && Array.isArray(msg.data)) {
          setOnlineUsers(msg.data as WebSocketUser[]);
        }
      } catch {
        // ignore invalid JSON
      }
    };

    ws.onclose = (ev): void => {
      setConnectionStatus('disconnected');
      setSocket(null);
      socketRef.current = null;
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

      if (ev.code !== 1000 && reconnectCount.current < reconnectAttempts) {
        const delay = reconnectIntervalMS * 1.5 ** reconnectCount.current;
        reconnectTimeout.current = setTimeout(() => {
          reconnectCount.current += 1;
          connect();
        }, delay);
      }
    };

    ws.onerror = (): void => {
      setConnectionStatus('error');
    };
  }, [url, token, reconnectAttempts, reconnectIntervalMS, heartbeatIntervalMS]);

  const sendMessage = useCallback(
    (message: Partial<WebSocketMessage>) => {
      if (socket?.readyState === WebSocket.OPEN) {
        const msg = { ...message, timestamp: new Date().toISOString() };
        socket.send(JSON.stringify(msg));
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