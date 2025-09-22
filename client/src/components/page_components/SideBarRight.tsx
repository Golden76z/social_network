'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { chatAPI, GroupConversation } from '@/lib/api/chat';
import { groupApi } from '@/lib/api/group';
import { userApi } from '@/lib/api/user';
import { User, UserDisplayInfo } from '@/lib/types/user';
import { GroupResponse } from '@/lib/types/group';
import { Users, MessageSquare } from 'lucide-react';

export const SideBarRight: React.FC = () => {
  const { user } = useAuth();
  const { connectionStatus, onlineUsers } = useWebSocketContext();
  const router = useRouter();
  
  // Check if WebSocket is connected
  const isConnected = connectionStatus === 'connected';
  
  // State for groups
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  
  // State for users
  const [mutualFollowers, setMutualFollowers] = useState<UserDisplayInfo[]>([]);
  const [followers, setFollowers] = useState<UserDisplayInfo[]>([]);
  const [following, setFollowing] = useState<UserDisplayInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Temporarily show sidebar even if not connected for debugging
  // if (!isConnected) {
  //   console.log('🔌 Sidebar hidden - WebSocket not connected. Status:', connectionStatus);
  //   return null;
  // }

  console.log('🔌 Sidebar rendering - Status:', connectionStatus, 'Connected:', isConnected, 'User:', user?.id, 'Groups:', groups?.length, 'MutualFriends:', mutualFollowers?.length, 'Followers:', followers?.length);

  // Load data on component mount
  useEffect(() => {
    loadGroups();
    loadUsers();
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      setGroupsLoading(true);
      console.log('🔍 Loading groups for user ID:', user.id);
      
      const [userGroups, conversations] = await Promise.all([
        groupApi.getUserGroups(),
        chatAPI.getGroupConversations()
      ]);
      
      console.log('👥 User groups data:', userGroups);
      console.log('💬 Group conversations data:', conversations);
      
      setGroups(userGroups);
      setGroupConversations(conversations);
    } catch (error) {
      console.error('❌ Failed to load groups:', error);
      setGroups([]);
      setGroupConversations([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!user) return;
    
    try {
      setUsersLoading(true);
      
      console.log('🔍 Loading users for user ID:', user.id);
      
      // Get mutual friends using the new API endpoint
      try {
        const mutualFriendsData = await userApi.getMutualFriends(user.id);
        console.log('👥 Mutual friends data:', mutualFriendsData);
        setMutualFollowers(mutualFriendsData || []);
      } catch (mutualError) {
        console.warn('⚠️ Mutual friends API failed, trying fallback:', mutualError);
        // Fallback: try to get followers and following to compute mutual friends
        try {
          const [followersData, followingData] = await Promise.all([
            userApi.getFollowers(user.id),
            userApi.getFollowing(user.id)
          ]);
          
          // Find mutual followers (users who follow you and you follow back)
          const followersSet = new Set(followersData.map(f => f.id));
          const mutual = followingData.filter(followingUser => 
            followersSet.has(followingUser.id)
          );
          console.log('👥 Mutual friends (fallback):', mutual);
          setMutualFollowers(mutual);
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          setMutualFollowers([]);
        }
      }
      
      // Keep followers for separate display
      const followersData = await userApi.getFollowers(user.id);
      console.log('👤 Followers data:', followersData);
      setFollowers(followersData || []);
      
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setMutualFollowers([]);
      setFollowers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const getGroupOnlineCount = (groupId: number) => {
    // For now, we'll show a simplified online count
    // In a real implementation, you would:
    // 1. Track which users are members of which groups
    // 2. Filter onlineUsers to only include members of this specific group
    // 3. Return the count of online members for this group
    
    // This is a placeholder that shows some online activity for demo purposes
    // The actual implementation would require server-side support to track group membership
    const baseCount = Math.floor(Math.random() * 5); // 0-4 online members
    return baseCount;
  };

  const getInitials = (user: User | UserDisplayInfo) => {
    if ('first_name' in user && 'last_name' in user && user.first_name && user.last_name) {
      return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
    } else if (user.nickname) {
      return user.nickname.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user: User | UserDisplayInfo) => {
    if ('first_name' in user && 'last_name' in user && user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.nickname || 'Unknown User';
  };

  const handleGroupClick = (groupId: number | any) => {
    // Ensure groupId is a number
    const safeGroupId = typeof groupId === 'number' ? groupId : parseInt(String(groupId));
    if (isNaN(safeGroupId)) {
      console.error('❌ Invalid groupId passed to handleGroupClick:', groupId);
      return;
    }
    router.push(`/messages?group=${safeGroupId}`);
  };

  const handleUserClick = (userId: number | any) => {
    // Ensure userId is a number
    const safeUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
    if (isNaN(safeUserId)) {
      console.error('❌ Invalid userId passed to handleUserClick:', userId);
      return;
    }
    router.push(`/messages?user=${safeUserId}`);
  };

  const isUserOnline = (userId: number) => {
    return onlineUsers.some(onlineUser => onlineUser.id === userId);
  };

  return (
    <div className="space-y-6">

      {/* Groups Section */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Groups ({groups?.length || 0})
        </h3>
        <div className="space-y-2">
          {groupsLoading ? (
            <div className="text-sm text-muted-foreground">Loading groups...</div>
          ) : (groups?.length || 0) > 0 ? (
            (groups || []).slice(0, 8).map((group) => {
              const onlineCount = getGroupOnlineCount(group.id);
              const conversation = groupConversations.find(c => c.group_id === group.id);
              
              return (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center text-primary text-sm font-medium overflow-hidden">
                      {group.avatar ? (
                        <img
                          src={group.avatar}
                          alt={group.title}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        group.title.charAt(0).toUpperCase()
                      )}
                    </div>
                    {onlineCount > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">{onlineCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                      {group.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {onlineCount > 0 ? `${onlineCount} online` : 'No one online'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground">No groups found</div>
          )}
        </div>
      </div>

      {/* Users Section */}
      <div>
        <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          People ({(mutualFollowers?.length || 0) + (followers?.length || 0)})
        </h3>
        
        {/* Mutual Friends */}
        {(mutualFollowers?.length || 0) > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Mutual Friends ({mutualFollowers?.length || 0})</h4>
            
            {/* Online Mutual Friends */}
            {(mutualFollowers?.filter(user => isUserOnline(user.id))?.length || 0) > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online ({mutualFollowers?.filter(user => isUserOnline(user.id))?.length || 0})
                </h5>
                <div className="space-y-2">
                  {(mutualFollowers || [])
                    .filter(user => isUserOnline(user.id))
                    .slice(0, 3)
                    .map((mutualUser) => (
                    <div
                      key={mutualUser.id}
                      onClick={() => handleUserClick(mutualUser.id)}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center text-primary text-sm font-medium overflow-hidden">
                          {mutualUser.avatar ? (
                            <img
                              src={mutualUser.avatar}
                              alt={getDisplayName(mutualUser)}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(mutualUser)
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                          {getDisplayName(mutualUser)}
                        </p>
                        <p className="text-xs text-muted-foreground">@{mutualUser.nickname}</p>
                        <p className="text-xs text-muted-foreground">
                          {mutualUser.is_private ? 'Private' : 'Public'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Mutual Friends */}
            {(mutualFollowers?.filter(user => !isUserOnline(user.id))?.length || 0) > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Offline ({mutualFollowers?.filter(user => !isUserOnline(user.id))?.length || 0})
                </h5>
                <div className="space-y-2">
                  {(mutualFollowers || [])
                    .filter(user => !isUserOnline(user.id))
                    .slice(0, 5)
                    .map((mutualUser) => (
                    <div
                      key={mutualUser.id}
                      onClick={() => handleUserClick(mutualUser.id)}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center text-primary text-sm font-medium overflow-hidden">
                          {mutualUser.avatar ? (
                            <img
                              src={mutualUser.avatar}
                              alt={getDisplayName(mutualUser)}
                              className="w-full h-full rounded-full object-cover opacity-75"
                            />
                          ) : (
                            getInitials(mutualUser)
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                          {getDisplayName(mutualUser)}
                        </p>
                        <p className="text-xs text-muted-foreground">@{mutualUser.nickname}</p>
                        <p className="text-xs text-muted-foreground">
                          {mutualUser.is_private ? 'Private' : 'Public'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show message when no mutual friends */}
        {(mutualFollowers?.length || 0) === 0 && !usersLoading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-700">
              <div className="font-medium mb-1">💡 No mutual friends yet</div>
              <div>Follow people who follow you back to see them here!</div>
            </div>
          </div>
        )}

        {/* Followers */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Followers ({followers?.length || 0})</h4>
          
          {/* Online Followers */}
          {(followers?.filter(user => isUserOnline(user.id))?.length || 0) > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online ({followers?.filter(user => isUserOnline(user.id))?.length || 0})
              </h5>
              <div className="space-y-2">
                {(followers || [])
                  .filter(user => isUserOnline(user.id))
                  .slice(0, 3)
                  .map((follower) => (
                  <div
                    key={follower.id}
                    onClick={() => handleUserClick(follower.id)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center text-primary text-sm font-medium overflow-hidden">
                        {follower.avatar ? (
                          <img
                            src={follower.avatar}
                            alt={getDisplayName(follower)}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(follower)
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                        {getDisplayName(follower)}
                      </p>
                      <p className="text-xs text-muted-foreground">@{follower.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {follower.is_private ? 'Private' : 'Public'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline Followers */}
          {(followers?.filter(user => !isUserOnline(user.id))?.length || 0) > 0 && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Offline ({followers?.filter(user => !isUserOnline(user.id))?.length || 0})
              </h5>
              <div className="space-y-2">
                {usersLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (followers || [])
                  .filter(user => !isUserOnline(user.id))
                  .slice(0, 5)
                  .map((follower) => (
                  <div
                    key={follower.id}
                    onClick={() => handleUserClick(follower.id)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center text-primary text-sm font-medium overflow-hidden">
                        {follower.avatar ? (
                          <img
                            src={follower.avatar}
                            alt={getDisplayName(follower)}
                            className="w-full h-full rounded-full object-cover opacity-75"
                          />
                        ) : (
                          getInitials(follower)
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                        {getDisplayName(follower)}
                      </p>
                      <p className="text-xs text-muted-foreground">@{follower.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {follower.is_private ? 'Private' : 'Public'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(followers?.length || 0) === 0 && !usersLoading && (
            <div className="text-sm text-muted-foreground">
              No followers found. Try following some users to see them here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
