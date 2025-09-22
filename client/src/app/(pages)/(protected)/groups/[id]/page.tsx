'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupResponse } from '@/lib/types/group';
import { groupApi } from '@/lib/api/group';
import { useAuth } from '@/context/AuthProvider';
import { GroupCard } from '@/components/GroupCard';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const groupId = params.id as string;

  useEffect(() => {
    const loadGroup = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch group details
        const groupData = await groupApi.getGroupById(groupId);
        setGroup(groupData);

        // Fetch member count
        try {
          const membersResponse = await groupApi.getGroupMembers(groupId);
          setMemberCount(Array.isArray(membersResponse) ? membersResponse.length : 0);
        } catch (err) {
          console.warn('Failed to get member count:', err);
          setMemberCount(0);
        }

      } catch (err) {
        console.error('Failed to load group:', err);
        setError('Failed to load group. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const handleJoinGroup = async () => {
    if (!group) return;
    
    try {
      await groupApi.createGroupRequest(group.id);
      alert('Join request sent! The group admin will review your request.');
      // Refresh the page to show updated request status
      window.location.reload();
    } catch (error) {
      console.error('Failed to request join group:', error);
      alert((error as Error).message || 'Failed to send join request. Please try again.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !user) return;
    
    try {
      setLeavingGroup(true);
      await groupApi.leaveGroup({ group_id: group.id, user_id: user.id });
      setMemberCount(prev => Math.max(0, prev - 1));
      setShowLeaveConfirm(false);
      // Refresh the page to show updated membership status
      window.location.reload();
    } catch (error) {
      console.error('Failed to leave group:', error);
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading group...</p>
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

  const isUserMember = groupId ? parseInt(groupId) % 2 === 0 : false;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={handleBack}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{group.title}</h1>
      </div>

      {/* Group Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Group Avatar */}
          <div className="w-full md:w-48 h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-4xl">
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

          {/* Group Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{group.title}</h2>
            <p className="text-muted-foreground mb-4">
              {group.bio || 'No description available'}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
              <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isUserMember ? (
                <>
                  <button 
                    onClick={() => router.push(`/groups/${group.id}/posts`)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    View Posts
                  </button>
                  <button 
                    onClick={handleLeaveClick}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Leave Group
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleJoinGroup}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Join Group
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group Card Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Group Preview</h3>
        <div className="max-w-sm">
          <GroupCard
            group={group}
            isMember={isUserMember}
            memberCount={memberCount}
            onJoin={handleJoinGroup}
            onLeave={handleLeaveClick}
            onView={() => {}} // Already viewing
          />
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveGroup}
        title="Leave Group"
        message={`Are you sure you want to leave "${group?.title}"? You'll need to request to join again if you change your mind.`}
        confirmText="Leave Group"
        cancelText="Cancel"
        variant="danger"
        isLoading={leavingGroup}
      />
    </div>
  );
}
