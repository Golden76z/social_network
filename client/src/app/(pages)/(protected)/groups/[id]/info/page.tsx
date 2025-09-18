'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupResponse } from '@/lib/types/group';
import { groupApi } from '@/lib/api/group';
import { useAuth } from '@/context/AuthProvider';

interface GroupMember {
  id: number;
  user_id: number;
  role: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

export default function GroupInfoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'events'>('posts');

  const groupId = params.id as string;

  useEffect(() => {
    const loadGroupInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch group details and members in parallel
        const [groupData, membersData] = await Promise.all([
          groupApi.getGroupById(groupId),
          groupApi.getGroupMembers(groupId)
        ]);

        setGroup(groupData);
        setMembers(Array.isArray(membersData) ? membersData : []);

        // Check if current user is a member and their role
        if (user) {
          const userMember = membersData.find((member: any) => member.user_id === user.id);
          setIsMember(!!userMember);
          setIsAdmin(userMember?.role === 'admin');
        }

      } catch (err) {
        console.error('Failed to load group info:', err);
        setError('Failed to load group information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      loadGroupInfo();
    }
  }, [groupId, user]);

  const handleJoinGroup = async () => {
    if (!group) return;
    
    try {
      await groupApi.joinGroup(group.id);
      setIsMember(true);
      // Refresh members list
      const membersData = await groupApi.getGroupMembers(groupId);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Failed to join group:', error);
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
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
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

      {/* Group Header */}
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
            <h2 className="text-2xl font-semibold mb-2">{group.title}</h2>
            <p className="text-muted-foreground mb-4">
              {group.bio || 'No description available'}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
              <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
              {isAdmin && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Admin</span>}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isMember ? (
                <>
                  <button 
                    onClick={() => router.push(`/groups/${group.id}/posts`)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    View Posts
                  </button>
                  {!isAdmin && (
                    <button 
                      onClick={handleLeaveGroup}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Leave Group
                    </button>
                  )}
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

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'posts'
                ? 'bg-white text-primary shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Posts
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'members'
                ? 'bg-white text-primary shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Members ({members.length})
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'events'
                ? 'bg-white text-primary shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              View All Posts
            </button>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Group Members</h3>
            {members.length > 0 ? (
              <div className="grid gap-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {member.nickname?.charAt(0) || member.username?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.nickname || member.username || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">Member since {new Date().toLocaleDateString()}</p>
                    </div>
                    {member.role === 'admin' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Admin</span>
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
        )}

        {activeTab === 'events' && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">📅</div>
            <p className="mb-4">Group events will be displayed here</p>
            <button 
              onClick={() => router.push(`/groups/${group.id}/events`)}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              View All Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
