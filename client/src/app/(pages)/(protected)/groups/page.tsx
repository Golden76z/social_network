'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GroupResponse } from '@/lib/types/group';
import { groupApi } from '@/lib/api/group';
import { useAuth } from '@/context/AuthProvider';
import { GroupCard } from '@/components/GroupCard';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { UserCheck } from 'lucide-react';

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [allGroups, setAllGroups] = useState<GroupResponse[]>([]);
  const [myGroups, setMyGroups] = useState<GroupResponse[]>([]);
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<number, number>>({});
  const [userMemberships, setUserMemberships] = useState<Set<number>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'all-groups'>('my-groups');
  const [showJoinSuccessModal, setShowJoinSuccessModal] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<GroupResponse | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showJoinSuccessModal) {
          setShowJoinSuccessModal(false);
          setJoinedGroup(null);
        }
        if (showCreateGroupModal) {
          setShowCreateGroupModal(false);
        }
      }
    };

    if (showJoinSuccessModal || showCreateGroupModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showJoinSuccessModal, showCreateGroupModal]);

  // Handle successful join request
  const handleJoinSuccess = (groupId: number) => {
    const group = allGroups.find(g => g.id === groupId);
    if (group) {
      setJoinedGroup(group);
      setShowJoinSuccessModal(true);
      // Update pending requests state
      setPendingRequests(prev => new Set([...prev, groupId]));
    }
  };

  // Load groups data
  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all groups, user groups, and pending requests in parallel
      const [allGroupsData, userGroupsData, pendingRequestsData] = await Promise.all([
        groupApi.getAllGroups(),
        groupApi.getUserGroups(),
        groupApi.getUserPendingRequests()
      ]);
      
      setAllGroups(allGroupsData || []);
      setMyGroups(userGroupsData || []);

      // Process pending requests
      const pendingSet = new Set<number>();
      if (pendingRequestsData && Array.isArray((pendingRequestsData as any).requests)) {
        (pendingRequestsData as any).requests.forEach((request: any) => {
          pendingSet.add(request.group_id);
        });
      }
      setPendingRequests(pendingSet);

      // Fetch member counts for all groups
      const memberCounts: Record<number, number> = {};
      const memberships = new Set<number>();
      
      // Add user groups to memberships set
      if (userGroupsData && Array.isArray(userGroupsData)) {
        userGroupsData.forEach(group => {
          memberships.add(group.id);
        });
      }
      
      // Get member counts for all groups
      if (allGroupsData && Array.isArray(allGroupsData)) {
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

  const handleJoinGroup = async (groupId: number) => {
    try {
      console.log('🚀 Attempting to create group request for group:', groupId);
      console.log('👤 Current user:', user);
      
      // Create a group request instead of direct join
      const response = await groupApi.createGroupRequest(groupId);
      console.log('✅ Group request created successfully:', response);
      
      // Handle successful join request with modal
      handleJoinSuccess(groupId);
      
    } catch (error) {
      console.error('❌ Failed to request join group:', error);
      const errorMessage = (error as Error).message;
      
      // If the error is about already having a pending request, just update the state
      if (errorMessage.includes('already has a pending request')) {
        handleJoinSuccess(groupId);
        return;
      }
      
      // For other errors, show the alert (fallback)
      alert(errorMessage || 'Failed to send join request. Please try again.');
    }
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
    setShowCreateGroupModal(true);
  };

  const handleCreateGroupSuccess = () => {
    setShowCreateGroupModal(false);
    // Reload groups to show the new one
    loadGroups();
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Groups</h1>
          <p className="text-muted-foreground">Discover and join communities that interest you</p>
        </div>
        <button 
          onClick={handleCreateGroup}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          Create Group
        </button>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-8 bg-muted/50 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('my-groups')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'my-groups'
              ? 'bg-card text-primary shadow-md border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          My Groups ({myGroups.length})
        </button>
        <button 
          onClick={() => setActiveTab('all-groups')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'all-groups'
              ? 'bg-card text-primary shadow-md border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          All Groups ({allGroups.length})
        </button>
      </div>

      {/* Groups Section */}
      <div className="bg-card rounded-xl border border-border/50 p-8 shadow-sm">
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
                    hasPendingRequest={pendingRequests.has(group.id)}
                    onJoin={handleJoinGroup}
                    onLeave={handleLeaveGroup}
                    onView={handleViewGroup}
                  />
                ))}
              </div>
            );
          } else {
            return (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-4xl">
                  👥
                </div>
                {activeTab === 'my-groups' ? (
                  <>
                    <h3 className="text-xl font-semibold text-foreground mb-3">No Groups Yet</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      You haven&apos;t joined any groups yet. Discover amazing communities and connect with like-minded people.
                    </p>
                    <button 
                      onClick={() => setActiveTab('all-groups')}
                      className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Discover Groups
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-foreground mb-3">No Groups Available</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Be the first to create a group and start building your community.
                    </p>
                    <button 
                      onClick={handleCreateGroup}
                      className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
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

      {/* Join Success Modal */}
      {showJoinSuccessModal && joinedGroup && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJoinSuccessModal(false);
              setJoinedGroup(null);
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                Join Request Sent
              </h3>
              <button
                onClick={() => {
                  setShowJoinSuccessModal(false);
                  setJoinedGroup(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">{joinedGroup.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Your request to join this group has been sent successfully.
                </p>
              </div>

              <div className="rounded-md bg-green-50 p-4 text-green-700 text-sm border border-green-200">
                <p className="font-medium mb-1">✅ Success</p>
                <p>The group admin will review your request and notify you of their decision.</p>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowJoinSuccessModal(false);
                  setJoinedGroup(null);
                }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={handleCreateGroupSuccess}
      />
    </div>
  );
}
