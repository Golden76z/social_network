'use client';

import { AuthProvider } from "./AuthProvider";
import { WebSocketProvider } from "./webSocketProvider";
import { NotificationProvider } from "@/lib/floating-notification";
import { config } from "@/config/environment";

// Combined Providers Component
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <WebSocketProvider url={config.WS_URL}>
          {children}
        </WebSocketProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};