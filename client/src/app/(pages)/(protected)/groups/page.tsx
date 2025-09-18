'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GroupResponse } from '@/lib/types/group';
import { groupApi } from '@/lib/api/group';
import { useAuth } from '@/context/AuthProvider';
import { GroupCard } from '@/components/GroupCard';

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [allGroups, setAllGroups] = useState<GroupResponse[]>([]);
  const [myGroups, setMyGroups] = useState<GroupResponse[]>([]);
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<number, number>>({});
  const [userMemberships, setUserMemberships] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'all-groups'>('my-groups');

  // Load groups data
  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all groups and user groups in parallel
      const [allGroupsData, userGroupsData] = await Promise.all([
        groupApi.getAllGroups(),
        groupApi.getUserGroups()
      ]);
      
      setAllGroups(allGroupsData);
      setMyGroups(userGroupsData);

      // Fetch member counts for all groups
      const memberCounts: Record<number, number> = {};
      const memberships = new Set<number>();
      
      // Add user groups to memberships set
      userGroupsData.forEach(group => {
        memberships.add(group.id);
      });
      
      // Get member counts for all groups
      for (const group of allGroupsData) {
        try {
          const membersResponse = await groupApi.getGroupMembers(group.id);
          const members = Array.isArray(membersResponse) ? membersResponse : [];
          memberCounts[group.id] = members.length;
        } catch (err) {
          console.warn(`Failed to get member count for group ${group.id}:`, err);
          memberCounts[group.id] = 0;
        }
      }
      
      setGroupMemberCounts(memberCounts);
      setUserMemberships(memberships);

    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Refresh data when page regains focus (e.g., returning from group creation)
  useEffect(() => {
    const handleFocus = () => {
      loadGroups();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleJoinGroup = (groupId: number) => {
    // Add to user memberships
    setUserMemberships(prev => new Set([...prev, groupId]));
    
    // Add to my groups if not already there
    setMyGroups(prev => {
      const group = allGroups.find(g => g.id === groupId);
      if (group && !prev.some(g => g.id === groupId)) {
        return [...prev, group];
      }
      return prev;
    });
  };

  const handleLeaveGroup = (groupId: number) => {
    // Remove from user memberships
    setUserMemberships(prev => {
      const newSet = new Set(prev);
      newSet.delete(groupId);
      return newSet;
    });
    
    // Remove from my groups
    setMyGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const handleViewGroup = (groupId: number) => {
    router.push(`/groups/${groupId}/info`);
  };

  const handleCreateGroup = () => {
    router.push('/groups/create');
  };

  const getMemberCount = (groupId: number) => {
    return groupMemberCounts[groupId] || 0;
  };

  const isUserMember = (groupId: number) => {
    return userMemberships.has(groupId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <button 
          onClick={handleCreateGroup}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Create Group
        </button>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button 
          onClick={() => setActiveTab('my-groups')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'my-groups'
              ? 'bg-white text-primary shadow-sm border border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          My Groups ({myGroups.length})
        </button>
        <button 
          onClick={() => setActiveTab('all-groups')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'all-groups'
              ? 'bg-white text-primary shadow-sm border border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          All Groups ({allGroups.length})
        </button>
      </div>

      {/* Groups Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {activeTab === 'my-groups' ? 'My Groups' : 'All Groups'}
          </h2>
          <span className="text-sm text-muted-foreground">
            {activeTab === 'my-groups' ? myGroups.length : allGroups.length} groups
          </span>
        </div>
        
        {(() => {
          const groupsToShow = activeTab === 'my-groups' ? myGroups : allGroups;
          
          if (groupsToShow.length > 0) {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groupsToShow.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isMember={isUserMember(group.id)}
                    memberCount={getMemberCount(group.id)}
                    onJoin={handleJoinGroup}
                    onLeave={handleLeaveGroup}
                    onView={handleViewGroup}
                  />
                ))}
              </div>
            );
          } else {
            return (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-4">👥</div>
                {activeTab === 'my-groups' ? (
                  <>
                    <p className="mb-4">You haven&apos;t joined any groups yet</p>
                    <button 
                      onClick={() => setActiveTab('all-groups')}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Discover Groups
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mb-4">No groups available</p>
                    <button 
                      onClick={handleCreateGroup}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Create First Group
                    </button>
                  </>
                )}
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
