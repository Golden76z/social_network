'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupResponse, UpdateGroupRequest } from '@/lib/types/group';
import { groupApi } from '@/lib/api/group';
import { userApi } from '@/lib/api/user';
import { useAuth } from '@/context/AuthProvider';
import { UserPlus, Settings, Users, UserCheck } from 'lucide-react';
import { UserDisplayInfo } from '@/lib/types';

interface GroupMember {
  id: number;
  user_id: number;
  role: string;
  username?: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

interface GroupRequest {
  id: number;
  group_id: number;
  user_id: number;
  status: string;
  created_at: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'events'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<UserDisplayInfo[]>([]);
  const [loadingMutualFollowers, setLoadingMutualFollowers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [groupRequests, setGroupRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    bio: '',
    avatar: '',
  });

  const groupId = params.id as string;

  const loadGroupInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch group details, members, and pending requests in parallel
      const [groupData, membersData, pendingRequestsData] = await Promise.all([
        groupApi.getGroupById(groupId),
        groupApi.getGroupMembers(groupId),
        groupApi.getUserPendingRequests()
      ]);

      setGroup(groupData);
      
      // Ensure membersData is an array
      const membersArray = Array.isArray(membersData) ? membersData : [];
      setMembers(membersArray);

      // Initialize form state
      setFormState({
        title: groupData.title,
        bio: groupData.bio || '',
        avatar: groupData.avatar || '',
      });

      // Check if current user is a member and their role
      if (user && Array.isArray(membersData)) {
        const userMember = membersData.find((member: any) => member.user_id === user.id);
        setIsMember(!!userMember);
        setIsAdmin(userMember?.role === 'admin');
      }

      // Check if user has a pending request for this group
      if (pendingRequestsData && Array.isArray(pendingRequestsData.requests)) {
        const hasRequest = pendingRequestsData.requests.some((request: any) => 
          request.group_id === parseInt(groupId)
        );
        setHasPendingRequest(hasRequest);
      }

    } catch (err) {
      console.error('Failed to load group info:', err);
      setError('Failed to load group information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroupInfo();
    }
  }, [groupId, user]);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showInviteModal) {
          setShowInviteModal(false);
          setSelectedUsers(new Set());
        }
        if (showRequestsModal) {
          setShowRequestsModal(false);
        }
        if (showLeaveConfirm) {
          setShowLeaveConfirm(false);
        }
      }
    };

    if (showInviteModal || showRequestsModal || showLeaveConfirm) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showInviteModal, showRequestsModal, showLeaveConfirm]);

  const handleJoinGroup = async () => {
    if (!group || hasPendingRequest) return;
    
    try {
      await groupApi.createGroupRequest(group.id);
      alert('Join request sent! The group admin will review your request.');
      // Update pending request state
      setHasPendingRequest(true);
    } catch (error) {
      console.error('Failed to request join group:', error);
      alert((error as Error).message || 'Failed to send join request. Please try again.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !user) return;
    
    try {
      await groupApi.leaveGroup({ group_id: group.id, user_id: user.id });
      setIsMember(false);
      setIsAdmin(false);
      // Refresh members list
      const membersData = await groupApi.getGroupMembers(groupId);
      const membersArray = Array.isArray(membersData) ? membersData : [];
      setMembers(membersArray);
      setShowLeaveConfirm(false);
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!group) return;
    
    try {
      setSaving(true);
      setError(null);

      const payload: UpdateGroupRequest = {
        title: formState.title,
        bio: formState.bio,
        avatar: formState.avatar,
      };

      const updatedGroup = await groupApi.updateGroup(group.id, payload);
      setGroup(updatedGroup);
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormState({
      title: group?.title || '',
      bio: group?.bio || '',
      avatar: group?.avatar || '',
    });
    setIsEditing(false);
    setError(null);
  };

  const getMutualFollowers = async () => {
    if (!user) return;
    
    try {
      setLoadingMutualFollowers(true);
      
      // Get followers and following lists
      const [followers, following] = await Promise.all([
        userApi.getFollowers(user.id),
        userApi.getFollowing(user.id)
      ]);
      
      // Find mutual followers (users who follow you and you follow back)
      const followersSet = new Set(followers.map(f => f.id));
      const mutual = following.filter(followingUser => 
        followersSet.has(followingUser.id)
      );
      
      setMutualFollowers(mutual);
    } catch (error) {
      console.error('Failed to get mutual followers:', error);
      setMutualFollowers([]);
    } finally {
      setLoadingMutualFollowers(false);
    }
  };

  const handleInvite = () => {
    setShowInviteModal(true);
    getMutualFollowers();
  };

  const handleUserSelection = (userId: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      // TODO: Implement group invitation API
      console.log('Sending invitations to:', Array.from(selectedUsers));
      
      // For now, just show success message
      alert(`Invitations sent to ${selectedUsers.size} user(s)!`);
      setSelectedUsers(new Set());
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to send invitations:', error);
      alert('Failed to send invitations. Please try again.');
    }
  };

  const loadGroupRequests = async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingRequests(true);
      const requests = await groupApi.getGroupRequests(groupId, 'pending');
      setGroupRequests(Array.isArray(requests) ? requests : []);
    } catch (error) {
      console.error('Failed to load group requests:', error);
      setGroupRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      await groupApi.approveGroupRequest(requestId);
      await loadGroupRequests(); // Refresh the list
      await loadGroupInfo(); // Refresh group info to update member count
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      await groupApi.declineGroupRequest(requestId);
      await loadGroupRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to decline request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  const handleManageRequests = () => {
    setShowRequestsModal(true);
    loadGroupRequests();
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading group information...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-muted-foreground mb-4">{error || 'Group not found'}</p>
        <button 
          onClick={handleBack}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">{group.title}</h1>

      <div className="space-y-6">
        {/* Group Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl">
              {group.avatar ? (
                <img 
                  src={group.avatar} 
                  alt={group.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                '👥'
              )}
            </div>
            <div className="flex-1 space-y-2">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className="w-full border border-border rounded px-3 py-2 text-lg font-semibold bg-background text-foreground"
                    value={formState.title}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Group Title"
                  />
                  <textarea
                    rows={3}
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground"
                    value={formState.bio}
                    onChange={(e) => setFormState(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Group Description"
                  />
                  <input
                    type="url"
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground"
                    value={formState.avatar}
                    onChange={(e) => setFormState(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="Avatar URL (optional)"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{group.title}</h2>
                  <p className="text-sm text-muted-foreground">{group.bio || 'No description available.'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                    <span>•</span>
                    <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                    {isAdmin && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Admin</span>}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {isMember ? (
                    <>
                      {/* Admin buttons */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={handleEdit}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={handleInvite}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Invite
                          </button>
                          <button
                            onClick={handleManageRequests}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />
                            Requests
                          </button>
                        </>
                      )}
                      {/* Regular member button */}
                      {!isAdmin && (
                        <button
                          onClick={handleInvite}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite
                        </button>
                      )}
                      {!isAdmin && (
                        <button 
                          onClick={handleLeaveClick}
                          className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
                        >
                          Leave Group
                        </button>
                      )}
                    </>
                  ) : (
                    <button 
                      onClick={handleJoinGroup}
                      disabled={hasPendingRequest}
                      className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                        hasPendingRequest 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {hasPendingRequest ? 'Request Sent' : 'Request Join'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* Group Stats */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{members.length}</div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Events</div>
            </div>
          </div>
        </div>

        {/* Posts/Events Tabs Section */}
        {isMember && (
          <div className="bg-card rounded-lg border border-border p-6">
            {/* Tab Buttons */}
            <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Events
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'posts' && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">📝</div>
                <p className="mb-4">Group posts will be displayed here</p>
                <button 
                  onClick={() => router.push(`/groups/${group.id}/posts`)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  View All Posts
                </button>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">📅</div>
                <p className="mb-4">Group events will be displayed here</p>
                <button 
                  onClick={() => router.push(`/groups/${group.id}/events`)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  View All Events
                </button>
              </div>
            )}
          </div>
        )}

        {/* Members Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({members.length})
            </h3>
          </div>
          
          {members.length > 0 ? (
            <div className="grid gap-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {member.nickname?.charAt(0) || member.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.nickname || 
                       (member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : member.first_name) || 
                       'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">Member since {new Date().toLocaleDateString()}</p>
                  </div>
                  {member.role === 'admin' && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Admin</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">👥</div>
              <p>No members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowInviteModal(false);
              setSelectedUsers(new Set());
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Invite Members
              </h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedUsers(new Set());
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Mutual Followers Section */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Invite Mutual Followers ({mutualFollowers.length})
                </h4>
                
                {loadingMutualFollowers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading mutual followers...</p>
                  </div>
                ) : mutualFollowers.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mutualFollowers.map((mutualUser) => (
                      <div
                        key={mutualUser.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUsers.has(mutualUser.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent'
                        }`}
                        onClick={() => handleUserSelection(mutualUser.id)}
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {mutualUser.nickname?.charAt(0) || mutualUser.username?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {mutualUser.nickname || mutualUser.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">@{mutualUser.username}</p>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 ${
                          selectedUsers.has(mutualUser.id)
                            ? 'bg-primary border-primary'
                            : 'border-border'
                        }`}>
                          {selectedUsers.has(mutualUser.id) && (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No mutual followers found</p>
                    <p className="text-xs">Follow more people to see mutual connections</p>
                  </div>
                )}
              </div>

              {/* Group Link Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Share Group Link</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/groups/${groupId}/info`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/groups/${groupId}/info`)}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedUsers(new Set());
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitations}
                disabled={selectedUsers.size === 0}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Invitations ({selectedUsers.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLeaveConfirm(false);
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Leave Group</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to leave "{group?.title}"? You'll need to request to join again if you change your mind.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveGroup}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Leave Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Requests Management Modal */}
      {showRequestsModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRequestsModal(false);
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                Group Requests ({groupRequests.length})
              </h3>
              <button
                onClick={() => setShowRequestsModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            {loadingRequests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : groupRequests.length > 0 ? (
              <div className="space-y-3">
                {groupRequests.map((request) => (
                  <div key={request.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {request.nickname?.charAt(0) || request.first_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {request.nickname || 
                         (request.first_name && request.last_name ? `${request.first_name} ${request.last_name}` : request.first_name) || 
                         'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.nickname ? `@${request.nickname}` : `User #${request.user_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No pending requests</p>
                <p className="text-sm">All join requests have been processed</p>
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowRequestsModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
