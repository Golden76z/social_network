'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupResponse, UpdateGroupRequest, GroupPost, GroupEvent, GroupMemberWithUser } from '@/lib/types/group';
import { Post } from '@/lib/types';
import { groupApi } from '@/lib/api/group';
import { reactionApi } from '@/lib/api/reaction';
import { userApi } from '@/lib/api/user';
import { useAuth } from '@/context/AuthProvider';
import { UserPlus, Settings, Users, UserCheck, Calendar, MessageSquare, Plus, Edit, Trash2, Clock, MapPin, Users2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { UserDisplayInfo } from '@/lib/types';
import { ProfileThumbnail } from '@/components/ProfileThumbnail';
import { AvatarFileInput } from '@/components/ui/avatar-file-input';
import { ModernInput } from '@/components/ui/modern-input';
import { ModernTextarea } from '@/components/ui/modern-textarea';
import { ModernSection } from '@/components/ui/modern-section';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { uploadPostImage } from '@/lib/api/upload';

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
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
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
  const [leavingGroup, setLeavingGroup] = useState(false);
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
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GroupEvent | null>(null);
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
      author_nickname: groupPost.author_nickname || 'Group Member', // Use actual nickname or fallback
      author_first_name: groupPost.author_first_name,
      author_last_name: groupPost.author_last_name,
      author_avatar: groupPost.author_avatar,
    };
  };
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<GroupEvent | null>(null);
  const [showJoinSuccessModal, setShowJoinSuccessModal] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    bio: '',
    avatar: '',
  });

  // Avatar change state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
        if (showJoinSuccessModal) {
          setShowJoinSuccessModal(false);
        }
        if (showRSVPModal) {
          setShowRSVPModal(false);
          setSelectedEvent(null);
        }
      }
    };

    if (showInviteModal || showRequestsModal || showLeaveConfirm || showCreatePostModal || showCreateEventModal || showRemoveMemberModal || showDeletePostModal || showDeleteEventModal || showJoinSuccessModal || showRSVPModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showInviteModal, showRequestsModal, showLeaveConfirm, showCreatePostModal, showCreateEventModal, showRemoveMemberModal, showDeletePostModal, showDeleteEventModal, showJoinSuccessModal, showRSVPModal]);

  const handleJoinGroup = async () => {
    if (!group || hasPendingRequest) return;
    
    try {
      const result = await groupApi.createGroupRequest(group.id);
      
      // Check if this was a duplicate request
      if (result && typeof result === 'object' && 'duplicate' in result) {
        // Handle duplicate request gracefully
        setHasPendingRequest(true);
        setShowJoinSuccessModal(true);
      } else {
        // Handle successful new request
        setHasPendingRequest(true);
        setShowJoinSuccessModal(true);
      }
    } catch (error) {
      console.error('Failed to request join group:', error);
      const errorMessage = (error as Error).message;
      
      // If the error is about already having a pending request, just update the state
      if (errorMessage.includes('already has a pending request')) {
        setHasPendingRequest(true);
        setShowJoinSuccessModal(true);
        return;
      }
      
      // For other errors, show the alert (fallback)
      alert(errorMessage || 'Failed to send join request. Please try again.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !user) return;
    
    try {
      setLeavingGroup(true);
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
    } finally {
      setLeavingGroup(false);
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

      // Upload avatar first if there's a new one
      let avatarUrl = group?.avatar;
      if (avatarFile) {
        try {
          const { url } = await uploadPostImage(avatarFile);
          avatarUrl = url;
          // Clean up preview
          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
          setAvatarFile(null);
        } catch (e: any) {
          setError('Failed to upload avatar. Please try again.');
          return; // Don't proceed with group update if avatar upload fails
        }
      }

      // Build payload with only non-empty fields (matching Go struct expectations)
      const payload: any = {};
      
      if (formState.title && formState.title.trim() !== '') {
        payload.title = formState.title.trim();
      }
      
      if (formState.bio && formState.bio.trim() !== '') {
        payload.bio = formState.bio.trim();
      }
      
      if (avatarUrl && avatarUrl.trim() !== '') {
        payload.avatar = avatarUrl.trim();
      }

      console.log('Sending payload:', payload);
      console.log('Group ID:', group.id);
      const updatedGroup = await groupApi.updateGroup(group.id, payload);
      console.log('Updated group:', updatedGroup);
      
      // Preserve all original group data and only update the modified fields
      const finalGroup = {
        ...group, // Keep all original data
        ...updatedGroup, // Apply updates from API response
        avatar: avatarUrl || updatedGroup.avatar || group.avatar // Ensure avatar is properly set
      };
      
      setGroup(finalGroup);
      
      // Update form state with the new group data
      setFormState({
        title: finalGroup.title,
        bio: finalGroup.bio || '',
        avatar: finalGroup.avatar || '',
      });
      
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
    // reset avatar selection
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
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

  const handleShowRSVPModal = (event: GroupEvent) => {
    setSelectedEvent(event);
    setShowRSVPModal(true);
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
      // Error will be handled by the UI
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

  const handleClosePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
    // No need to refresh posts - the like/comment actions already update the local state
  };

  const handleEditGroupPost = async (post: any) => {
    // Open edit modal for group post
    setEditingPost(post);
    setShowCreatePostModal(true);
  };

  const handleDeleteGroupPost = async (post: any) => {
    try {
      await groupApi.deleteGroupPost(post.id);
      await loadPosts();
      setShowPostModal(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to delete group post:', error);
      // The PostModal will handle showing the error via its confirmation dialog
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
          <div className="flex items-start gap-6">
            {/* Group Avatar - Enhanced with light purple outline */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full border-6 border-muted-foreground/20 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden shadow-lg">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview}
                    alt={group.title}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : group.avatar ? (
                  <img 
                    src={group.avatar.startsWith('http') ? group.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${group.avatar}`}
                    alt={group.title}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground/60">
                    {group.title.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  {/* Avatar change controls */}
                  <ModernSection>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <AvatarFileInput
                          onChange={(file) => {
                            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                            if (file) {
                              setAvatarPreview(URL.createObjectURL(file));
                              setAvatarFile(file);
                            }
                          }}
                          onError={(title, message) => {
                            alert(`${title}: ${message}`);
                          }}
                        />
                      </div>
                    </div>
                  </ModernSection>

                  {/* Group Information */}
                  <ModernSection title="Group Information">
                    <ModernInput
                      type="text"
                      value={formState.title}
                      onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Group Title"
                    />
                    <ModernTextarea
                      rows={2}
                      value={formState.bio}
                      onChange={(e) => setFormState(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Group Description"
                    />
                  </ModernSection>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group Title and Info */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-card-foreground">{group.title}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                      <span className="text-muted-foreground text-sm">•</span>
                      <span className="text-sm text-muted-foreground">Created {new Date(group.created_at).toLocaleDateString()}</span>
                      {isAdmin && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Admin</span>}
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-card-foreground">About</h3>
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <p className="text-card-foreground leading-relaxed">
                        {group.bio || 'No description available yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary/80 text-primary-foreground rounded-lg hover:bg-primary disabled:opacity-50 transition-colors"
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
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={handleInvite}
                              className="px-4 py-2 bg-primary/80 text-primary-foreground rounded-lg hover:bg-primary transition-colors flex items-center gap-2"
                            >
                              <UserPlus className="w-4 h-4" />
                              Invite
                            </button>
                            <button
                              onClick={handleManageRequests}
                              className="px-4 py-2 bg-green-500/60 text-white rounded-lg hover:bg-green-500/80 transition-colors flex items-center gap-2"
                            >
                              <Users className="w-4 h-4" />
                              Requests
                            </button>
                          </div>
                          <button
                            onClick={handleEdit}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      )}
                      {/* Regular member button */}
                      {!isAdmin && (
                        <button
                          onClick={handleInvite}
                          className="px-4 py-2 bg-primary/80 text-primary-foreground rounded-lg hover:bg-primary transition-colors flex items-center gap-2"
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
                          : 'bg-primary/80 text-primary-foreground hover:bg-primary'
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
                    className="px-4 py-2 bg-primary/80 text-primary-foreground rounded-lg hover:bg-primary transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Event
                  </button>
                </div>
                
                {loadingEvents ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground text-lg">Loading events...</p>
                  </div>
                ) : events.length > 0 ? (
                  <div className="grid gap-6">
                    {events.slice(0, 5).map((event) => {
                      const rsvps = eventRSVPs.get(event.id) || [];
                      const userRSVP = user ? rsvps.find((rsvp: any) => rsvp.user_id === user.id) : null;
                      const goingCount = rsvps.filter((rsvp: any) => rsvp.status === 'come').length;
                      const maybeCount = rsvps.filter((rsvp: any) => rsvp.status === 'interested').length;
                      const notGoingCount = rsvps.filter((rsvp: any) => rsvp.status === 'not_come').length;
                      const eventDate = new Date(event.event_datetime);
                      const isPastEvent = eventDate < new Date();
                      
                      return (
                        <div 
                          key={event.id} 
                          className="group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 cursor-pointer"
                          onClick={() => handleShowRSVPModal(event)}
                        >
                          {/* Event Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                  <Calendar className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                    {event.title}
                                  </h4>
                                  {event.creator_nickname && (
                                    <p className="text-sm text-muted-foreground">
                                      Created by <span className="font-medium text-primary">{event.creator_nickname}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            {((user && event.creator_id === user.id) || isAdmin) && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(user && event.creator_id === user.id) && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEvent(event);
                                    }}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="Edit event"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event);
                                  }}
                                  disabled={deletingEvent === event.id}
                                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete event"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Event Description */}
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>

                          {/* Event Details */}
                          <div className="flex items-center gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span className={isPastEvent ? 'text-destructive' : 'text-foreground'}>
                                {eventDate.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="text-muted-foreground">
                                {eventDate.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                            </div>
                          </div>

                          {/* RSVP Stats */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-500/80" />
                                <span className="text-green-600/80 font-medium">{goingCount}</span>
                                <span className="text-muted-foreground">Going</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4 text-yellow-500/80" />
                                <span className="text-yellow-600/80 font-medium">{maybeCount}</span>
                                <span className="text-muted-foreground">Maybe</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-red-500/80" />
                                <span className="text-red-600/80 font-medium">{notGoingCount}</span>
                                <span className="text-muted-foreground">Not Going</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowRSVPModal(event);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:text-primary-foreground hover:bg-primary rounded-lg transition-colors"
                            >
                              <Users2 className="w-4 h-4" />
                              View All ({rsvps.length})
                            </button>
                          </div>
                          
                          {/* RSVP Actions */}
                          <div className="flex gap-2">
                            {userRSVP ? (
                              <div className="flex gap-2 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                                  {userRSVP.status === 'come' ? (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Going
                                    </>
                                  ) : userRSVP.status === 'interested' ? (
                                    <>
                                      <AlertCircle className="w-4 h-4" />
                                      Maybe
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4" />
                                      Not Going
                                    </>
                                  )}
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateRSVP(userRSVP.id, 'come');
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-green-500/80 text-white rounded-lg text-sm hover:bg-green-500 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Going
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateRSVP(userRSVP.id, 'interested');
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-yellow-500/80 text-white rounded-lg text-sm hover:bg-yellow-500 transition-colors"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  Maybe
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateRSVP(userRSVP.id, 'not_come');
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-red-500/80 text-white rounded-lg text-sm hover:bg-red-500 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Not Going
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelRSVP(userRSVP.id);
                                  }}
                                  className="px-3 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 flex-wrap">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRSVP(event.id, 'come');
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-green-500/80 text-white rounded-lg text-sm hover:bg-green-500 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Going
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRSVP(event.id, 'interested');
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-yellow-500/80 text-white rounded-lg text-sm hover:bg-yellow-500 transition-colors"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  Maybe
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRSVP(event.id, 'not_come');
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-red-500/80 text-white rounded-lg text-sm hover:bg-red-500 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Not Going
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {events.length > 5 && (
                      <div className="text-center pt-6">
                        <button 
                          onClick={() => router.push(`/groups/${group.id}/events`)}
                          className="px-8 py-3 bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground rounded-xl hover:from-primary hover:to-primary/80 transition-all duration-300 shadow-lg hover:shadow-primary/25 font-medium"
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
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/profile/${member.user_id}`)}
                  >
                    <ProfileThumbnail
                      src={member.avatar}
                      alt="member avatar"
                      size="md"
                      rounded
                      initials={member.nickname || member.first_name || 'U'}
                    />
                  </div>
                  <div 
                    className="flex-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => router.push(`/profile/${member.user_id}`)}
                  >
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
                        <ProfileThumbnail
                          src={(mutualUser as any).avatar}
                          alt="user avatar"
                          size="sm"
                          rounded
                          initials={mutualUser.nickname || 'U'}
                        />
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
                    <ProfileThumbnail
                      src={request.avatar}
                      alt="request user avatar"
                      size="md"
                      rounded
                      initials={request.nickname || request.first_name || 'U'}
                    />
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
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setEditingPost(null);
          setPostFormData({ title: '', body: '' });
          setPostError('');
        }}
        onSuccess={() => {
          // Refresh posts after successful creation
          loadPosts();
        }}
        isGroupPost={true}
        groupId={group?.id}
        groupName={group?.title}
        postId={editingPost?.id}
        initialTitle={editingPost?.title || ''}
        initialContent={editingPost?.body || ''}
        initialImages={editingPost?.images || []}
      />

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
                <Trash2 className="w-5 h-5 text-destructive" />
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
                <ProfileThumbnail
                  src={memberToRemove.avatar}
                  alt="member avatar"
                  size="md"
                  rounded
                  initials={memberToRemove.nickname || memberToRemove.first_name || 'U'}
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {memberToRemove.nickname || 
                     (memberToRemove.first_name && memberToRemove.last_name ? `${memberToRemove.first_name} ${memberToRemove.last_name}` : memberToRemove.first_name) || 
                     'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground">Group Member</p>
                </div>
              </div>

              <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm border border-destructive/20">
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
                className="flex-1 px-4 py-2 rounded-lg btn-delete disabled:cursor-not-allowed"
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
                <Trash2 className="w-5 h-5 text-destructive" />
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

              <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm border border-destructive/20">
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
                className="flex-1 px-4 py-2 rounded-lg btn-delete disabled:cursor-not-allowed"
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

      {/* Join Success Modal */}
      {showJoinSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJoinSuccessModal(false);
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
                onClick={() => setShowJoinSuccessModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium text-foreground mb-2">{group?.title}</h4>
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
                onClick={() => setShowJoinSuccessModal(false)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Got it
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
        currentUserId={user?.id}
        onEdit={handleEditGroupPost}
        onDelete={handleDeleteGroupPost}
        isGroupAdmin={isAdmin}
      />

      {/* RSVP Modal */}
      {showRSVPModal && selectedEvent && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRSVPModal(false);
              setSelectedEvent(null);
            }
          }}
        >
          <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedEvent.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedEvent.event_datetime).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRSVPModal(false);
                  setSelectedEvent(null);
                }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">{selectedEvent.description}</p>

            {/* RSVP Sections */}
            {(() => {
              const rsvps = eventRSVPs.get(selectedEvent.id) || [];
              const goingRSVPs = rsvps.filter((rsvp: any) => rsvp.status === 'come');
              const maybeRSVPs = rsvps.filter((rsvp: any) => rsvp.status === 'interested');
              const notGoingRSVPs = rsvps.filter((rsvp: any) => rsvp.status === 'not_come');

              return (
                <div className="space-y-6">
                  {/* Going Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h4 className="font-semibold text-lg text-foreground">Going ({goingRSVPs.length})</h4>
                    </div>
                    {goingRSVPs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {goingRSVPs.map((rsvp: any) => (
                          <div key={rsvp.id} className="flex items-center gap-3 p-3 bg-green-50/50 dark:bg-green-950/10 rounded-lg border border-green-200/50 dark:border-green-800/30">
                            <div 
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => router.push(`/profile/${rsvp.user_id}`)}
                            >
                              {rsvp.avatar ? (
                                <img
                                  src={rsvp.avatar.startsWith('http') ? rsvp.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${rsvp.avatar}`}
                                  alt={rsvp.nickname || 'User'}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-green-600 font-medium text-sm">
                                  {(rsvp.nickname || rsvp.first_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div 
                              className="flex-1 min-w-0 cursor-pointer hover:text-green-600 dark:hover:text-green-200 transition-colors"
                              onClick={() => router.push(`/profile/${rsvp.user_id}`)}
                            >
                              <p className="font-medium text-sm text-green-700 dark:text-green-300 truncate">
                                {rsvp.nickname || `${rsvp.first_name || ''} ${rsvp.last_name || ''}`.trim() || 'Unknown User'}
                              </p>
                              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                                Responded {new Date(rsvp.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No one is going yet</p>
                      </div>
                    )}
                  </div>

                  {/* Maybe Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-semibold text-lg text-foreground">Maybe ({maybeRSVPs.length})</h4>
                    </div>
                    {maybeRSVPs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {maybeRSVPs.map((rsvp: any) => (
                          <div key={rsvp.id} className="flex items-center gap-3 p-3 bg-yellow-50/50 dark:bg-yellow-950/10 rounded-lg border border-yellow-200/50 dark:border-yellow-800/30">
                            <div 
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => router.push(`/profile/${rsvp.user_id}`)}
                            >
                              {rsvp.avatar ? (
                                <img
                                  src={rsvp.avatar.startsWith('http') ? rsvp.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${rsvp.avatar}`}
                                  alt={rsvp.nickname || 'User'}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-yellow-600 font-medium text-sm">
                                  {(rsvp.nickname || rsvp.first_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div 
                              className="flex-1 min-w-0 cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-200 transition-colors"
                              onClick={() => router.push(`/profile/${rsvp.user_id}`)}
                            >
                              <p className="font-medium text-sm text-yellow-700 dark:text-yellow-300 truncate">
                                {rsvp.nickname || `${rsvp.first_name || ''} ${rsvp.last_name || ''}`.trim() || 'Unknown User'}
                              </p>
                              <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
                                Responded {new Date(rsvp.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No maybes yet</p>
                      </div>
                    )}
                  </div>

                  {/* Not Going Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <h4 className="font-semibold text-lg text-foreground">Not Going ({notGoingRSVPs.length})</h4>
                    </div>
                    {notGoingRSVPs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {notGoingRSVPs.map((rsvp: any) => (
                          <div key={rsvp.id} className="flex items-center gap-3 p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-200/50 dark:border-red-800/30">
                            <div 
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => router.push(`/profile/${rsvp.user_id}`)}
                            >
                              {rsvp.avatar ? (
                                <img
                                  src={rsvp.avatar.startsWith('http') ? rsvp.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${rsvp.avatar}`}
                                  alt={rsvp.nickname || 'User'}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-red-600 font-medium text-sm">
                                  {(rsvp.nickname || rsvp.first_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div 
                              className="flex-1 min-w-0 cursor-pointer hover:text-red-600 dark:hover:text-red-200 transition-colors"
                              onClick={() => router.push(`/profile/${rsvp.user_id}`)}
                            >
                              <p className="font-medium text-sm text-red-700 dark:text-red-300 truncate">
                                {rsvp.nickname || `${rsvp.first_name || ''} ${rsvp.last_name || ''}`.trim() || 'Unknown User'}
                              </p>
                              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                                Responded {new Date(rsvp.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No one declined yet</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
