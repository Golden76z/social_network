'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useWebSocketContext } from '@/context/webSocketProvider';

interface OnlineUser {
  id: number;
  username: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  is_online: boolean;
  last_seen?: string;
}

interface OfflineUser {
  id: number;
  username: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  is_online: boolean;
  last_seen?: string;
}

export const SideBarRight: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocketContext();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<OfflineUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration - in real app, this would come from API
  useEffect(() => {
    // Simulate loading online/offline users
    setTimeout(() => {
      setOnlineUsers([
        { id: 2, username: 'john_doe', nickname: 'John', first_name: 'John', last_name: 'Doe', is_online: true },
        { id: 3, username: 'jane_smith', nickname: 'Jane', first_name: 'Jane', last_name: 'Smith', is_online: true },
        { id: 4, username: 'mike_wilson', nickname: 'Mike', first_name: 'Mike', last_name: 'Wilson', is_online: true },
      ]);
      
      setOfflineUsers([
        { id: 5, username: 'sarah_jones', nickname: 'Sarah', first_name: 'Sarah', last_name: 'Jones', is_online: false, last_seen: '2h ago' },
        { id: 6, username: 'alex_brown', nickname: 'Alex', first_name: 'Alex', last_name: 'Brown', is_online: false, last_seen: '1d ago' },
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const getInitials = (user: OnlineUser | OfflineUser) => {
    if (user.first_name && user.last_name) {
      return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
    } else if (user.nickname) {
      return user.nickname.charAt(0).toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  const getDisplayName = (user: OnlineUser | OfflineUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.nickname || user.username;
  };

  return (
    <div className="space-y-6">
      {/* Online Members */}
      {isConnected && (
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-4">
            Online Now ({onlineUsers.length})
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : onlineUsers.length > 0 ? (
              onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getInitials(user)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getDisplayName(user)}
                    </p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No one online</div>
            )}
          </div>
        </div>
      )}

      {/* Offline Mutual Friends */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-4">
          Mutual Friends ({offlineUsers.length})
        </h3>
        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : offlineUsers.length > 0 ? (
            offlineUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium">
                    {getInitials(user)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-muted-foreground border-2 border-background rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getDisplayName(user)}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.last_seen}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No mutual friends</div>
          )}
        </div>
      </div>

      {/* Trending */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-4">Trending</h3>
        <div className="space-y-3">
          <p className="text-base text-muted-foreground hover:text-primary cursor-pointer transition-colors">
            #photography
          </p>
          <p className="text-base text-muted-foreground hover:text-primary cursor-pointer transition-colors">
            #travel
          </p>
          <p className="text-base text-muted-foreground hover:text-primary cursor-pointer transition-colors">
            #food
          </p>
          <p className="text-base text-muted-foreground hover:text-primary cursor-pointer transition-colors">
            #nature
          </p>
        </div>
      </div>
    </div>
  );
};
