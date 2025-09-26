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

  // Generate gradient colors based on group title - much lighter colors
  const getGradientColors = (title: string) => {
    const colors = [
      'from-blue-100 to-purple-100',
      'from-green-100 to-blue-100',
      'from-orange-100 to-red-100',
      'from-purple-100 to-pink-100',
      'from-red-100 to-yellow-100',
      'from-blue-100 to-green-100',
    ];
    const index = title.charCodeAt(0) % colors.length;
    return colors[index];
  };


  return (
    <div className="group p-6 border border-border/50 rounded-xl bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
      {/* Group Avatar */}
      <div className="relative overflow-hidden rounded-xl mb-6 cursor-pointer" onClick={handleView}>
        <div className={`w-full h-48 bg-gradient-to-br ${getGradientColors(group.title)} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border-4 border-muted-foreground/20`}>
          {group.avatar ? (
            <img 
              src={group.avatar.startsWith('http') ? group.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${group.avatar}`}
              alt={group.title}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-6xl font-bold text-muted-foreground/60">
                {group.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
      </div>

      {/* Group Info */}
      <div className="flex-1 flex flex-col">
        <h3 
          className="font-bold mb-3 text-xl text-foreground group-hover:text-primary transition-colors cursor-pointer hover:text-primary"
          onClick={handleView}
        >
          {group.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 line-clamp-3 min-h-[3.6rem] leading-relaxed">
          {group.bio || 'No description available'}
        </p>

        {/* Member Count and Actions */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
              <span className="font-medium">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {isMember ? (
              <>
                <button 
                  onClick={handleView}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  View Group
                </button>
                <button 
                  onClick={handleLeave}
                  disabled={isLoading}
                  className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Leaving...' : 'Leave'}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleView}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-all duration-200"
                >
                  View Group
                </button>
                <button 
                  onClick={handleJoin}
                  disabled={isLoading || hasPendingRequest}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                    hasPendingRequest 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isLoading ? 'Requesting...' : hasPendingRequest ? 'Request Sent' : 'Join'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
