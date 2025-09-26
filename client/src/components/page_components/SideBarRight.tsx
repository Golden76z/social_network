'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { chatAPI, GroupConversation } from '@/lib/api/chat';
import { groupApi } from '@/lib/api/group';
import { userApi } from '@/lib/api/user';
import { User, UserDisplayInfo } from '@/lib/types/user';
import { GroupResponse } from '@/lib/types/group';
import { ExpandableSection } from '@/components/ui/ExpandableSection';
import { UserList } from '@/components/ui/UserList';
import { GroupList } from '@/components/ui/GroupList';
import { Users, MessageSquare, UserPlus } from 'lucide-react';

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
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);
  const [groupMembersMap, setGroupMembersMap] = useState<Record<number, number[]>>({});
  
  // State for users
  const [mutualFollowers, setMutualFollowers] = useState<UserDisplayInfo[]>([]);
  const [followers, setFollowers] = useState<UserDisplayInfo[]>([]);
  const [following, setFollowing] = useState<UserDisplayInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    if (!user) return;
    loadGroups();
    loadUsers();
  }, [user]);

  // Listen for WebSocket updates to refresh data in real-time
  useEffect(() => {
    if (!isConnected) return;

    const handleWebSocketUpdate = () => {
      loadGroups();
      loadUsers();
    };

    // Listen for user_joined, user_left, and other relevant events
    const checkForUpdates = () => {
      // This will be triggered by WebSocket context updates
      handleWebSocketUpdate();
    };

    // Remove the interval that was causing the 5-second refresh
    // The WebSocket context will handle real-time updates properly
    return () => {
      // Cleanup if needed
    };
  }, [isConnected, user]);


  const loadGroups = async () => {
    if (!user) return;
    
    try {
      setGroupsLoading(true);
      
      const [userGroups, conversations] = await Promise.all([
        groupApi.getUserGroups(),
        chatAPI.getGroupConversations()
      ]);
      
      setGroups(userGroups);
      setGroupConversations(conversations);
      await preloadGroupMembers(userGroups);
    } catch (error) {
      console.error('❌ Failed to load groups:', error);
      setGroups([]);
      setGroupConversations([]);
      setGroupMembersMap({});
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!user) return;
    
    try {
      setUsersLoading(true);
      
      // Get mutual friends using the new API endpoint
      try {
        const mutualFriendsData = await userApi.getMutualFriends(user.id);
        setMutualFollowers(mutualFriendsData || []);
      } catch (mutualError) {
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
          setMutualFollowers(mutual);
        } catch (fallbackError) {
          setMutualFollowers([]);
        }
      }
      
      // Keep followers for separate display
      const followersData = await userApi.getFollowers(user.id);
      setFollowers(followersData || []);
      
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setMutualFollowers([]);
      setFollowers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const onlineUserIdSet = useMemo(() => new Set(onlineUsers.map(user => user.id)), [onlineUsers]);

  const preloadGroupMembers = useCallback(async (groupList: GroupResponse[]) => {
    if (!groupList || groupList.length === 0) {
      setGroupMembersMap({});
      return;
    }

    try {
      setGroupMembersLoading(true);
      const groupsToProcess = groupList.slice(0, 8); // Limit to 8 groups

      const memberEntries = await Promise.all(
        groupsToProcess.map(async (group) => {
          try {
            const members = await groupApi.getGroupMembers(group.id);
            const memberIds = (members || [])
              .map((member: { user_id: number }) => Number(member.user_id))
              .filter((id: number) => Number.isFinite(id));
            return [group.id, memberIds] as const;
          } catch (error) {
            console.error('❌ Failed to load group members:', error);
            return [group.id, []] as const;
          }
        })
      );

      setGroupMembersMap((prev) => {
        const next = { ...prev };
        for (const [groupId, memberIds] of memberEntries) {
          next[groupId] = memberIds;
        }
        return next;
      });
    } finally {
      setGroupMembersLoading(false);
    }
  }, []);

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
    <div className="space-y-4">
      {/* Groups Section - only show if there are groups or loading */}
      {((groups?.length || 0) > 0 || groupsLoading) && (
        <ExpandableSection
          title="Groups"
          count={groups?.length || 0}
          icon={<MessageSquare className="w-4 h-4" />}
          defaultExpanded={true}
        >
          {groupsLoading ? (
            <div className="text-sm text-muted-foreground p-2">Loading groups...</div>
          ) : (groups?.length || 0) > 0 ? (
            <GroupList
              groups={groups}
              groupConversations={groupConversations}
              onlineUsers={onlineUsers}
              groupMembersMap={groupMembersMap}
              onGroupClick={handleGroupClick}
              maxDisplay={8}
            />
          ) : (
            <div className="text-sm text-muted-foreground p-2">No groups found</div>
          )}
        </ExpandableSection>
      )}

      {/* Friends Section (Mutual Friends) - only show if there are friends or loading */}
      {((mutualFollowers?.length || 0) > 0 || usersLoading) && (
        <ExpandableSection
          title="Friends"
          count={mutualFollowers?.length || 0}
          icon={<Users className="w-4 h-4" />}
          defaultExpanded={true}
        >
          {(mutualFollowers?.length || 0) > 0 ? (
            <div className="space-y-2">
              {/* Online Friends */}
              {(mutualFollowers?.filter(user => isUserOnline(user.id))?.length || 0) > 0 && (
                <div>
                  <ExpandableSection
                    title="Online"
                    count={mutualFollowers?.filter(user => isUserOnline(user.id))?.length || 0}
                    defaultExpanded={true}
                    className="mb-2"
                  >
                    <UserList
                      users={mutualFollowers?.filter(user => isUserOnline(user.id)) || []}
                      onlineUsers={onlineUsers}
                      onUserClick={handleUserClick}
                      maxDisplay={5}
                    />
                  </ExpandableSection>
                </div>
              )}

              {/* Offline Friends */}
              {(mutualFollowers?.filter(user => !isUserOnline(user.id))?.length || 0) > 0 && (
                <div>
                  <ExpandableSection
                    title="Offline"
                    count={mutualFollowers?.filter(user => !isUserOnline(user.id))?.length || 0}
                    defaultExpanded={false}
                  >
                    <UserList
                      users={mutualFollowers?.filter(user => !isUserOnline(user.id)) || []}
                      onlineUsers={onlineUsers}
                      onUserClick={handleUserClick}
                      maxDisplay={5}
                    />
                  </ExpandableSection>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-2">
              No mutual friends yet. Follow people who follow you back!
            </div>
          )}
        </ExpandableSection>
      )}

      {/* Followers Section - only show if there are followers or loading */}
      {((followers?.length || 0) > 0 || usersLoading) && (
        <ExpandableSection
          title="Followers"
          count={followers?.length || 0}
          icon={<UserPlus className="w-4 h-4" />}
          defaultExpanded={false}
        >
          {(followers?.length || 0) > 0 ? (
            <div className="space-y-2">
              {/* Online Followers */}
              {(followers?.filter(user => isUserOnline(user.id))?.length || 0) > 0 && (
                <div>
                  <ExpandableSection
                    title="Online"
                    count={followers?.filter(user => isUserOnline(user.id))?.length || 0}
                    defaultExpanded={true}
                    className="mb-2"
                  >
                    <UserList
                      users={followers?.filter(user => isUserOnline(user.id)) || []}
                      onlineUsers={onlineUsers}
                      onUserClick={handleUserClick}
                      maxDisplay={5}
                    />
                  </ExpandableSection>
                </div>
              )}

              {/* Offline Followers */}
              {(followers?.filter(user => !isUserOnline(user.id))?.length || 0) > 0 && (
                <div>
                  <ExpandableSection
                    title="Offline"
                    count={followers?.filter(user => !isUserOnline(user.id))?.length || 0}
                    defaultExpanded={false}
                  >
                    <UserList
                      users={followers?.filter(user => !isUserOnline(user.id)) || []}
                      onlineUsers={onlineUsers}
                      onUserClick={handleUserClick}
                      maxDisplay={5}
                    />
                  </ExpandableSection>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-2">
              No followers found. Try following some users!
            </div>
          )}
        </ExpandableSection>
      )}
    </div>
  );
};
