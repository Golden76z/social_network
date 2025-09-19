import React, { useState } from 'react';
import { GroupResponse } from '@/lib/types/group';
import { groupApi } from '@/lib/api/group';
import { useAuth } from '@/context/AuthProvider';

interface GroupCardProps {
  group: GroupResponse;
  isMember?: boolean;
  memberCount?: number;
  hasPendingRequest?: boolean;
  onJoin?: (groupId: number) => void;
  onLeave?: (groupId: number) => void;
  onView?: (groupId: number) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  isMember = false,
  memberCount = 0,
  hasPendingRequest = false,
  onJoin,
  onLeave,
  onView,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleJoin = async () => {
    if (isLoading || hasPendingRequest) return;
    try {
      setIsLoading(true);
      await groupApi.createGroupRequest(group.id);
      onJoin?.(group.id);
    } catch (error) {
      console.error('Failed to request join group:', error);
      // Show user-friendly error message
      alert((error as Error).message || 'Failed to send join request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      await groupApi.leaveGroup({ group_id: group.id, user_id: user?.id || 0 });
      onLeave?.(group.id);
    } catch (error) {
      console.error('Failed to leave group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => {
    onView?.(group.id);
  };

  // Generate gradient colors based on group title
  const getGradientColors = (title: string) => {
    const colors = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-blue-500',
      'from-orange-500 to-red-500',
      'from-purple-500 to-pink-500',
      'from-red-500 to-yellow-500',
      'from-blue-500 to-green-500',
    ];
    const index = title.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get emoji based on group title
  const getGroupEmoji = (title: string) => {
    const emojis = ['👥', '📚', '💻', '🍳', '🎨', '🏃', '🎵', '🎮', '📷', '🌱'];
    const index = title.charCodeAt(0) % emojis.length;
    return emojis[index];
  };

  return (
    <div className="p-6 border border-border rounded-lg bg-card hover:shadow-md transition-shadow h-full">
      {/* Group Avatar */}
      <div className={`w-full h-40 bg-gradient-to-r ${getGradientColors(group.title)} rounded-lg mb-4 flex items-center justify-center text-white text-3xl`}>
        {group.avatar ? (
          <img 
            src={group.avatar} 
            alt={group.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          getGroupEmoji(group.title)
        )}
      </div>

      {/* Group Info */}
      <h3 className="font-semibold mb-3 text-xl">{group.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[3.6rem]">
        {group.bio || 'No description available'}
      </p>

      {/* Member Count and Actions */}
      <div className="flex items-center justify-between text-sm mt-auto">
        <span className="text-muted-foreground font-medium">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        
        <div className="flex gap-2">
          {isMember ? (
            <>
              <button 
                onClick={handleView}
                className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
              >
                View
              </button>
              <button 
                onClick={handleLeave}
                disabled={isLoading}
                className="px-4 py-2 border border-border rounded text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Leaving...' : 'Leave'}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleView}
                className="px-4 py-2 border border-border rounded text-sm hover:bg-accent transition-colors"
              >
                View
              </button>
              <button 
                onClick={handleJoin}
                disabled={isLoading || hasPendingRequest}
                className={`px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 ${
                  hasPendingRequest 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isLoading ? 'Requesting...' : hasPendingRequest ? 'Request Sent' : 'Request Join'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
