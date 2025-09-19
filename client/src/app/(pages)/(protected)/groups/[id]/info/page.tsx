'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupResponse, UpdateGroupRequest, GroupPost, GroupEvent } from '@/lib/types/group';
import { Post } from '@/lib/types';
import { groupApi } from '@/lib/api/group';
import { reactionApi } from '@/lib/api/reaction';
import { userApi } from '@/lib/api/user';
import { useAuth } from '@/context/AuthProvider';
import { UserPlus, Settings, Users, UserCheck, Calendar, MessageSquare, Plus, Edit, Trash2 } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';
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
  
  // Posts and Events state
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventRSVPs, setEventRSVPs] = useState<Map<number, any[]>>(new Map());
  
  // Modal states
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [postFormData, setPostFormData] = useState({ title: '', body: '' });
  const [eventFormData, setEventFormData] = useState({ title: '', description: '', event_date: '', event_time: '' });
  const [creatingPost, setCreatingPost] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [postError, setPostError] = useState('');
  const [eventError, setEventError] = useState('');
  const [editingEvent, setEditingEvent] = useState<GroupEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<number | null>(null);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberWithUser | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [editingPost, setEditingPost] = useState<GroupPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<number | null>(null);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<GroupPost | null>(null);
  const [userReactions, setUserReactions] = useState<{[postId: number]: 'like' | 'dislike' | null}>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Utility function to convert GroupPost to Post format
  const convertGroupPostToPost = (groupPost: GroupPost): Post => {
    return {
      id: groupPost.id,
      user_id: groupPost.user_id,
      author_id: groupPost.user_id, // Map user_id to author_id for PostCard compatibility
      title: groupPost.title,
      body: groupPost.body,
      visibility: 'public' as const, // Group posts are always visible to group members
      created_at: groupPost.created_at,
      updated_at: groupPost.updated_at,
      images: groupPost.images || [],
      likes: groupPost.likes || 0,
      dislikes: groupPost.dislikes || 0,
      user_liked: groupPost.user_liked || false,
      user_disliked: groupPost.user_disliked || false,
      author_nickname: 'Group Member', // Default nickname for group posts
    };
  };
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<GroupEvent | null>(null);

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
      if (pendingRequestsData && Array.isArray((pendingRequestsData as any).requests)) {
        const hasRequest = (pendingRequestsData as any).requests.some((request: any) => 
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

  // Load posts and events when active tab changes
  useEffect(() => {
    if (isMember && groupId) {
      if (activeTab === 'posts') {
        loadPosts();
      } else if (activeTab === 'events') {
        loadEvents();
      }
    }
  }, [activeTab, isMember, groupId]);

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
        if (showCreatePostModal) {
          setShowCreatePostModal(false);
          setEditingPost(null);
          setPostFormData({ title: '', body: '' });
          setPostError('');
        }
        if (showCreateEventModal) {
          setShowCreateEventModal(false);
          setEditingEvent(null);
          setEventFormData({ title: '', description: '', event_date: '', event_time: '' });
          setEventError('');
        }
        if (showRemoveMemberModal) {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }
        if (showDeletePostModal) {
          setShowDeletePostModal(false);
          setPostToDelete(null);
        }
        if (showDeleteEventModal) {
          setShowDeleteEventModal(false);
          setEventToDelete(null);
        }
      }
    };

    if (showInviteModal || showRequestsModal || showLeaveConfirm || showCreatePostModal || showCreateEventModal || showRemoveMemberModal || showDeletePostModal || showDeleteEventModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showInviteModal, showRequestsModal, showLeaveConfirm, showCreatePostModal, showCreateEventModal, showRemoveMemberModal, showDeletePostModal, showDeleteEventModal]);

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

  const loadPosts = async () => {
    if (!isMember) return;
    
    try {
      setLoadingPosts(true);
      const postsData = await groupApi.getGroupPosts(groupId);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadEvents = async () => {
    if (!isMember) return;
    
    try {
      setLoadingEvents(true);
      const eventsData = await groupApi.getGroupEvents(groupId);
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventsArray);
      
      // Load RSVPs for each event
      const rsvpPromises = eventsArray.map(async (event) => {
        try {
          const rsvps = await groupApi.getEventRSVPs(event.id);
          return { eventId: event.id, rsvps: Array.isArray(rsvps) ? rsvps : [] };
        } catch (error) {
          console.error(`Failed to load RSVPs for event ${event.id}:`, error);
          return { eventId: event.id, rsvps: [] };
        }
      });
      
      const rsvpResults = await Promise.all(rsvpPromises);
      const rsvpMap = new Map<number, any[]>();
      rsvpResults.forEach(({ eventId, rsvps }) => {
        rsvpMap.set(eventId, rsvps);
      });
      setEventRSVPs(rsvpMap);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleRSVP = async (eventId: number, status: string) => {
    if (!user) return;
    
    try {
      await groupApi.rsvpToEvent({
        event_id: eventId,
        user_id: user.id,
        status: status
      });
      
      // Refresh events to update RSVP data
      await loadEvents();
    } catch (error) {
      console.error('Failed to RSVP:', error);
      alert('Failed to update RSVP. Please try again.');
    }
  };

  const handleUpdateRSVP = async (rsvpId: number, status: string) => {
    try {
      await groupApi.updateEventRSVP(rsvpId, status);
      
      // Refresh events to update RSVP data
      await loadEvents();
    } catch (error) {
      console.error('Failed to update RSVP:', error);
      alert('Failed to update RSVP. Please try again.');
    }
  };

  const handleCancelRSVP = async (rsvpId: number) => {
    try {
      await groupApi.cancelEventRSVP(rsvpId);
      
      // Refresh events to update RSVP data
      await loadEvents();
    } catch (error) {
      console.error('Failed to cancel RSVP:', error);
      alert('Failed to cancel RSVP. Please try again.');
    }
  };

  const handleCreatePost = async () => {
    if (!group || !postFormData.title.trim() || !postFormData.body.trim()) {
      setPostError('Please fill in all fields');
      return;
    }

    try {
      setCreatingPost(true);
      setPostError('');
      
      await groupApi.createGroupPost({
        group_id: group.id,
        title: postFormData.title.trim(),
        body: postFormData.body.trim()
      });

      // Close modal and refresh posts
      setShowCreatePostModal(false);
      setPostFormData({ title: '', body: '' });
      await loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      setPostError((error as Error).message || 'Failed to create post. Please try again.');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!group || !eventFormData.title.trim() || !eventFormData.description.trim() || !eventFormData.event_date.trim() || !eventFormData.event_time.trim()) {
      setEventError('Please fill in all fields');
      return;
    }

    try {
      setCreatingEvent(true);
      setEventError('');
      
      // Format datetime as "YYYY-MM-DD HH:MM:SS"
      const eventDateTime = `${eventFormData.event_date} ${eventFormData.event_time}:00`;
      
      await groupApi.createGroupEvent({
        group_id: group.id,
        title: eventFormData.title.trim(),
        description: eventFormData.description.trim(),
        event_date_time: eventDateTime
      });

      // Close modal and refresh events
      setShowCreateEventModal(false);
      setEventFormData({ title: '', description: '', event_date: '', event_time: '' });
      await loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      setEventError((error as Error).message || 'Failed to create event. Please try again.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleEditEvent = (event: GroupEvent) => {
    // Parse the datetime to separate date and time
    const eventDate = new Date(event.event_datetime);
    const dateStr = eventDate.toISOString().slice(0, 10);
    const timeStr = eventDate.toTimeString().slice(0, 5);
    
    setEventFormData({
      title: event.title,
      description: event.description,
      event_date: dateStr,
      event_time: timeStr
    });
    setEditingEvent(event);
    setShowCreateEventModal(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventFormData.title.trim() || !eventFormData.description.trim() || !eventFormData.event_date.trim() || !eventFormData.event_time.trim()) {
      setEventError('Please fill in all fields');
      return;
    }

    try {
      setCreatingEvent(true);
      setEventError('');
      
      // Format datetime as "YYYY-MM-DD HH:MM:SS"
      const eventDateTime = `${eventFormData.event_date} ${eventFormData.event_time}:00`;
      
      await groupApi.updateGroupEvent(editingEvent.id, {
        title: eventFormData.title.trim(),
        description: eventFormData.description.trim(),
        event_date_time: eventDateTime
      });

      // Close modal and refresh events
      setShowCreateEventModal(false);
      setEditingEvent(null);
      setEventFormData({ title: '', description: '', event_date: '', event_time: '' });
      await loadEvents();
    } catch (error) {
      console.error('Failed to update event:', error);
      setEventError((error as Error).message || 'Failed to update event. Please try again.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = (event: GroupEvent) => {
    setEventToDelete(event);
    setShowDeleteEventModal(true);
  };

  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      setDeletingEvent(eventToDelete.id);
      await groupApi.deleteGroupEvent(eventToDelete.id);
      await loadEvents();
      setShowDeleteEventModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleRemoveMember = (member: GroupMemberWithUser) => {
    setMemberToRemove(member);
    setShowRemoveMemberModal(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !group) return;

    try {
      setRemovingMember(true);
      await groupApi.removeGroupMember(group.id, memberToRemove.user_id);
      
      // Refresh members list
      const membersData = await groupApi.getGroupMembers(group.id);
      const membersArray = Array.isArray(membersData) ? membersData : [];
      setMembers(membersArray);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setRemovingMember(false);
    }
  };

  const handleEditPost = (post: GroupPost) => {
    setPostFormData({
      title: post.title,
      body: post.body
    });
    setEditingPost(post);
    setShowCreatePostModal(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !postFormData.title.trim() || !postFormData.body.trim()) {
      setPostError('Please fill in all fields');
      return;
    }

    try {
      setCreatingPost(true);
      setPostError('');
      
      await groupApi.updateGroupPost(editingPost.id, {
        title: postFormData.title.trim(),
        body: postFormData.body.trim()
      });

      // Close modal and refresh posts
      setShowCreatePostModal(false);
      setEditingPost(null);
      setPostFormData({ title: '', body: '' });
      await loadPosts();
    } catch (error) {
      console.error('Failed to update post:', error);
      setPostError((error as Error).message || 'Failed to update post. Please try again.');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = (post: GroupPost) => {
    setPostToDelete(post);
    setShowDeletePostModal(true);
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      setDeletingPost(postToDelete.id);
      await groupApi.deleteGroupPost(postToDelete.id);
      await loadPosts();
      setShowDeletePostModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeletingPost(null);
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      const currentReaction = userReactions[postId];
      
      if (currentReaction === 'like') {
        // Remove like
        await reactionApi.deleteReaction({ id: postId });
        setUserReactions(prev => ({ ...prev, [postId]: null }));
      } else {
        // Add or change to like
        await reactionApi.createReaction({ group_post_id: postId, type: 'like' });
        setUserReactions(prev => ({ ...prev, [postId]: 'like' }));
      }
      
      // Refresh posts to update counts
      await loadPosts();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleDislikePost = async (postId: number) => {
    try {
      const currentReaction = userReactions[postId];
      
      if (currentReaction === 'dislike') {
        // Remove dislike
        await reactionApi.deleteReaction({ id: postId });
        setUserReactions(prev => ({ ...prev, [postId]: null }));
      } else {
        // Add or change to dislike
        await reactionApi.createReaction({ group_post_id: postId, type: 'dislike' });
        setUserReactions(prev => ({ ...prev, [postId]: 'dislike' }));
      }
      
      // Refresh posts to update counts
      await loadPosts();
    } catch (error) {
      console.error('Failed to dislike post:', error);
    }
  };

  const handleViewPostDetails = (postId: number) => {
    const groupPost = posts.find(p => p.id === postId);
    if (groupPost) {
      const convertedPost = convertGroupPostToPost(groupPost);
      setSelectedPost(convertedPost);
      setShowPostModal(true);
    }
  };

  const handleClosePostModal = async () => {
    setShowPostModal(false);
    setSelectedPost(null);
    
    // Refresh posts when closing modal
    try {
      await loadPosts();
    } catch (error) {
      console.error('Error refreshing posts after modal close:', error);
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
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{members.length}</div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{posts.length}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{events.length}</div>
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Posts ({posts.length})
                  </h3>
                  <button 
                    onClick={() => setShowCreatePostModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Post
                  </button>
                </div>
                
                {loadingPosts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading posts...</p>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((groupPost) => {
                      const convertedPost = convertGroupPostToPost(groupPost);
                      const canEdit = isAdmin || (user && groupPost.user_id === user.id);
                      const canDelete = isAdmin || (user && groupPost.user_id === user.id);
                      
                      return (
                        <div key={groupPost.id} className="relative">
                          <PostCard
                            post={convertedPost}
                            onLike={handleLikePost}
                            onComment={handleViewPostDetails}
                            onViewDetails={handleViewPostDetails}
                            onUserClick={() => {}} // Group posts don't have user profiles
                          />
                          {/* Edit/Delete buttons overlay */}
                          {(canEdit || canDelete) && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              {canEdit && (
                                <button 
                                  onClick={() => handleEditPost(groupPost)}
                                  className="p-1 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground rounded-full transition-colors"
                                  title="Edit post"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button 
                                  onClick={() => handleDeletePost(groupPost)}
                                  disabled={deletingPost === groupPost.id}
                                  className="p-1 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-red-500 disabled:opacity-50 rounded-full transition-colors"
                                  title="Delete post"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {posts.length > 5 && (
                      <div className="text-center pt-4">
                        <button 
                          onClick={() => router.push(`/groups/${group.id}/posts`)}
                          className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                          View All Posts ({posts.length})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No posts yet</p>
                    <p className="text-sm">Be the first to create a post in this group</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Events ({events.length})
                  </h3>
                  <button 
                    onClick={() => setShowCreateEventModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Event
                  </button>
                </div>
                
                {loadingEvents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading events...</p>
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event) => {
                      const rsvps = eventRSVPs.get(event.id) || [];
                      const userRSVP = user ? rsvps.find((rsvp: any) => rsvp.user_id === user.id) : null;
                      
                      return (
                        <div key={event.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{event.title}</h4>
                            {(isAdmin || (user && event.creator_id === user.id)) && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEditEvent(event)}
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                  title="Edit event"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEvent(event)}
                                  disabled={deletingEvent === event.id}
                                  className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                                  title="Delete event"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{event.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                            <span>{new Date(event.event_datetime).toLocaleString()}</span>
                            <span>{rsvps.length} RSVPs</span>
                          </div>
                          
                          {/* RSVP Buttons */}
                          <div className="flex gap-2">
                            {userRSVP ? (
                              <div className="flex gap-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded text-xs">
                                  {userRSVP.status === 'come' ? 'Going' : 
                                   userRSVP.status === 'interested' ? 'Maybe' : 'Not Going'}
                                </span>
                                <button 
                                  onClick={() => handleUpdateRSVP(userRSVP.id, 'come')}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                                >
                                  Going
                                </button>
                                <button 
                                  onClick={() => handleUpdateRSVP(userRSVP.id, 'interested')}
                                  className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
                                >
                                  Maybe
                                </button>
                                <button 
                                  onClick={() => handleUpdateRSVP(userRSVP.id, 'not_come')}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                >
                                  Not Going
                                </button>
                                <button 
                                  onClick={() => handleCancelRSVP(userRSVP.id)}
                                  className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleRSVP(event.id, 'come')}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                                >
                                  Going
                                </button>
                                <button 
                                  onClick={() => handleRSVP(event.id, 'interested')}
                                  className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
                                >
                                  Maybe
                                </button>
                                <button 
                                  onClick={() => handleRSVP(event.id, 'not_come')}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                >
                                  Not Going
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {events.length > 5 && (
                      <div className="text-center pt-4">
                        <button 
                          onClick={() => router.push(`/groups/${group.id}/events`)}
                          className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                          View All Events ({events.length})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No events yet</p>
                    <p className="text-sm">Be the first to create an event in this group</p>
                  </div>
                )}
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
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Admin</span>
                    )}
                    {isAdmin && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
                          {mutualUser.nickname?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {mutualUser.nickname || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">@{mutualUser.nickname}</p>
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

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreatePostModal(false);
              setEditingPost(null);
              setPostFormData({ title: '', body: '' });
              setPostError('');
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {editingPost ? 'Edit Post' : 'Create Post'}
              </h3>
              <button
                onClick={() => {
                  setShowCreatePostModal(false);
                  setPostFormData({ title: '', body: '' });
                  setPostError('');
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {postError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700 text-sm border border-red-200">
                  {postError}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title *</label>
                <input
                  type="text"
                  value={postFormData.title}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter post title"
                  maxLength={100}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Content *</label>
                <textarea
                  value={postFormData.body}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Write your post content..."
                  rows={6}
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {postFormData.body.length}/1000 characters
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowCreatePostModal(false);
                  setPostFormData({ title: '', body: '' });
                  setPostError('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingPost ? handleUpdatePost : handleCreatePost}
                disabled={creatingPost || !postFormData.title.trim() || !postFormData.body.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingPost ? (editingPost ? 'Updating...' : 'Creating...') : (editingPost ? 'Update Post' : 'Create Post')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateEventModal(false);
              setEditingEvent(null);
              setEventFormData({ title: '', description: '', event_date: '', event_time: '' });
              setEventError('');
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {editingEvent ? 'Edit Event' : 'Create Event'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateEventModal(false);
                  setEventFormData({ title: '', description: '', event_date: '', event_time: '' });
                  setEventError('');
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {eventError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700 text-sm border border-red-200">
                  {eventError}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Event Title *</label>
                <input
                  type="text"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter event title"
                  maxLength={255}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description *</label>
                <textarea
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Describe your event..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Date *</label>
                  <input
                    type="date"
                    value={eventFormData.event_date}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, event_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Time *</label>
                  <input
                    type="time"
                    value={eventFormData.event_time}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, event_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="00:00"
                    max="05:00"
                    step="1800"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowCreateEventModal(false);
                  setEventFormData({ title: '', description: '', event_date: '', event_time: '' });
                  setEventError('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                disabled={creatingEvent || !eventFormData.title.trim() || !eventFormData.description.trim() || !eventFormData.event_date.trim() || !eventFormData.event_time.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingEvent ? (editingEvent ? 'Updating...' : 'Creating...') : (editingEvent ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberModal && memberToRemove && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRemoveMemberModal(false);
              setMemberToRemove(null);
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Remove Member
              </h3>
              <button
                onClick={() => {
                  setShowRemoveMemberModal(false);
                  setMemberToRemove(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/50">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {memberToRemove.nickname?.charAt(0) || memberToRemove.first_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {memberToRemove.nickname || 
                     (memberToRemove.first_name && memberToRemove.last_name ? `${memberToRemove.first_name} ${memberToRemove.last_name}` : memberToRemove.first_name) || 
                     'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground">Group Member</p>
                </div>
              </div>

              <div className="rounded-md bg-red-50 p-4 text-red-700 text-sm border border-red-200">
                <p className="font-medium mb-1">⚠️ Warning</p>
                <p>Are you sure you want to remove this member from the group? This action cannot be undone and they will lose access to all group content.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowRemoveMemberModal(false);
                  setMemberToRemove(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveMember}
                disabled={removingMember}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingMember ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {showDeletePostModal && postToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeletePostModal(false);
              setPostToDelete(null);
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Delete Post
              </h3>
              <button
                onClick={() => {
                  setShowDeletePostModal(false);
                  setPostToDelete(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">{postToDelete.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">{postToDelete.body}</p>
              </div>

              <div className="rounded-md bg-red-50 p-4 text-red-700 text-sm border border-red-200">
                <p className="font-medium mb-1">⚠️ Warning</p>
                <p>Are you sure you want to delete this post? This action cannot be undone and all comments and reactions will be lost.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowDeletePostModal(false);
                  setPostToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletePost}
                disabled={deletingPost === postToDelete.id}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingPost === postToDelete.id ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {showDeleteEventModal && eventToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteEventModal(false);
              setEventToDelete(null);
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Delete Event
              </h3>
              <button
                onClick={() => {
                  setShowDeleteEventModal(false);
                  setEventToDelete(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">{eventToDelete.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{eventToDelete.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(eventToDelete.event_datetime).toLocaleString()}
                </p>
              </div>

              <div className="rounded-md bg-red-50 p-4 text-red-700 text-sm border border-red-200">
                <p className="font-medium mb-1">⚠️ Warning</p>
                <p>Are you sure you want to delete this event? This action cannot be undone and all RSVPs will be lost.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setShowDeleteEventModal(false);
                  setEventToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteEvent}
                disabled={deletingEvent === eventToDelete.id}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingEvent === eventToDelete.id ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={showPostModal}
        onClose={handleClosePostModal}
        onLike={handleLikePost}
        disableInteractions={false}
        isAuthenticated={!!user}
        isGroupPost={true}
      />
    </div>
  );
}
