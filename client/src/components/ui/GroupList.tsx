'use client';

import { GroupResponse } from '@/lib/types/group';
import { GroupConversation } from '@/lib/api/chat';

interface GroupListProps {
  groups: GroupResponse[];
  groupConversations: GroupConversation[];
  onlineUsers: { id: number }[];
  groupMembersMap: Record<number, number[]>;
  onGroupClick: (groupId: number) => void;
  maxDisplay?: number;
  showOnlineStatus?: boolean;
  className?: string;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  groupConversations,
  onlineUsers,
  groupMembersMap,
  onGroupClick,
  maxDisplay = 5,
  showOnlineStatus = true,
  className = '',
}) => {
  const onlineUserIdSet = new Set(onlineUsers.map(user => user.id));

  const getGroupOnlineCount = (groupId: number) => {
    const members = groupMembersMap[groupId] || [];
    let onlineCount = 0;

    for (const memberId of members) {
      if (onlineUserIdSet.has(memberId)) {
        onlineCount += 1;
      }
    }

    return onlineCount;
  };

  const groupsWithPresence = groups.map(group => ({
    group,
    onlineCount: getGroupOnlineCount(group.id),
  }));

  const displayGroups = groupsWithPresence.slice(0, maxDisplay);

  if (displayGroups.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground p-2 ${className}`}>
        No groups found
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {displayGroups.map(({ group, onlineCount }) => {
        const conversation = groupConversations.find(c => c.group_id === group.id);
        const isOnline = showOnlineStatus && onlineCount > 0;
        
        return (
          <div
            key={group.id}
            onClick={() => onGroupClick(group.id)}
            className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors group"
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium overflow-hidden ${
                isOnline 
                  ? 'border-primary/30 bg-primary/10 text-primary' 
                  : 'border-border/40 bg-muted/40 text-muted-foreground'
              }`}>
                {group.avatar ? (
                  <img
                    src={group.avatar.startsWith('http') ? group.avatar : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${group.avatar}`}
                    alt={group.title}
                    className={`w-full h-full rounded-full object-cover ${
                      !isOnline ? 'opacity-75' : ''
                    }`}
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = group.title.charAt(0).toUpperCase();
                      }
                    }}
                  />
                ) : (
                  group.title.charAt(0).toUpperCase()
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 min-w-[1.25rem] h-5 bg-green-500 border-2 border-background rounded-full px-1 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold leading-none">{onlineCount}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary mb-1">
                {group.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {conversation?.last_message
                  ? `Last: ${conversation.last_message}`
                  : `${onlineCount} online`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
