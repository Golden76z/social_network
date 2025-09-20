'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { userApi } from '@/lib/api/user';
import { postApi } from '@/lib/api/post';
import {
  UpdateUserRequest,
  UserProfile,
  UserDisplayInfo,
  Post,
} from '@/lib/types';
import { uploadAvatar } from '@/lib/api/upload';
import { Lock, Unlock, UserMinus, UserPlus, Users, UserCheck } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';
import { Avatar } from '@/components/Avatar';
import { ProfileThumbnail } from '@/components/ProfileThumbnail';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModernInput } from '@/components/ui/modern-input';
import { ModernTextarea } from '@/components/ui/modern-textarea';
import { ModernCheckbox } from '@/components/ui/modern-checkbox';
import { ModernSection } from '@/components/ui/modern-section';
import { ModernFileInput } from '@/components/ui/modern-file-input';
import { AvatarFileInput } from '@/components/ui/avatar-file-input';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserDisplayInfo[];
  title: string;
  onUserClick: (userId: number) => void;
  isOwnProfile?: boolean;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-card rounded-lg max-w-md w-full border border-border"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-full"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <p className="text-card-foreground">{message}</p>
        </div>
        <div className="flex justify-end p-4 border-t border-border">
          <Button onClick={onClose} variant="outline" size="default">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  users,
  title,
  onUserClick,
  isOwnProfile = false,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key and click outside
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFollowers = title === 'Followers';
  const icon = isFollowers ? Users : UserCheck;

  // Get the appropriate title based on context
  const getModalTitle = () => {
    console.log('getModalTitle called:', { isOwnProfile, isFollowers, title });
    if (isOwnProfile) {
      return isFollowers ? 'People that follow you' : 'People you follow';
    }
    return title;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {React.createElement(icon, { className: "w-5 h-5" })}
            {getModalTitle()} ({users.length})
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {React.createElement(icon, { className: "w-8 h-8 text-muted-foreground opacity-50" })}
              </div>
              <h4 className="text-lg font-medium text-card-foreground mb-2">
                No {title.toLowerCase()} yet
              </h4>
              <p className="text-muted-foreground text-sm">
                {isFollowers 
                  ? (isOwnProfile 
                      ? "You don't have any followers yet." 
                      : "This user doesn't have any followers yet.")
                  : (isOwnProfile 
                      ? "You aren't following anyone yet." 
                      : "This user isn't following anyone yet.")
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onUserClick(user.id)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent cursor-pointer transition-all duration-200 hover:shadow-md group hover:border-primary/20"
                >
                  <ProfileThumbnail
                    src={typeof user.avatar === 'string' ? user.avatar : undefined}
                    alt={`${user.fullName} avatar`}
                    size="md"
                    rounded
                    initials={user.nickname || 'U'}
                    className="group-hover:scale-105 transition-transform duration-200 ring-2 ring-transparent group-hover:ring-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="space-y-1">
                      {user.first_name && user.last_name ? (
                        <h4 className="font-semibold text-base text-card-foreground truncate group-hover:text-primary transition-colors">
                          {user.first_name} {user.last_name}
                        </h4>
                      ) : (
                        <h4 className="font-semibold text-base text-card-foreground truncate group-hover:text-primary transition-colors">
                          {user.fullName}
                        </h4>
                      )}
                      <p className="text-sm text-muted-foreground truncate font-medium">
                        @{user.nickname}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-105">
                      <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ProfilePageContent() {
  const { user, isLoading, hasCheckedAuth, checkAuth } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [followersModal, setFollowersModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following';
  }>({ isOpen: false, type: 'followers' });
  const [followers, setFollowers] = useState<UserDisplayInfo[]>([]);
  const [following, setFollowing] = useState<UserDisplayInfo[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [formState, setFormState] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    bio: '',
    is_private: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar change state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // Posts sections state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'commented'>(
    'posts',
  );

  // Helper function to determine if viewing own profile
  const isOwnProfile = () => {
    if (!user) return false; // Must be authenticated to view own profile
    if (!userId) return true; // No userId means own profile (only if authenticated)
    return parseInt(userId) === user.id; // userId matches current user
  };

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let profileData;

        // If no userId and no user, redirect to login (trying to access own profile without auth)
        if (!userId && !user) {
          router.push('/login');
          return;
        }

        if (isOwnProfile()) {
          // Load own profile (requires authentication)
          profileData = await userApi.getProfile();
        } else {
          // Load other user's profile (works for both authenticated and unauthenticated users)
          if (!userId) return; // Need userId to load other user's profile
          profileData = await userApi.getUserById(parseInt(userId));
        }
        setProfileUser(profileData);
        setFormState({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          nickname: profileData.nickname,
          bio: profileData.bio || '',
          is_private: profileData.is_private,
        });
      } catch {
        console.error('Error loading profile');
      }
    };

    // Load profile if:
    // 1. We have a userId (viewing someone else's profile) - works for both authenticated and unauthenticated
    // 2. We're authenticated and viewing our own profile (no userId)
    if (userId || (hasCheckedAuth && !isLoading && user)) {
      loadProfile();
    }
  }, [user, hasCheckedAuth, isLoading, userId, router]);

  // Load posts after profile data is loaded
  // Normalize posts to ensure author_* fields are always present
  const normalizePosts = (posts: Post[], fallback?: UserProfile): Post[] => {
    return (posts || []).map((p) => {
      const anyP: any = p as any;
      // Common locations where author info might be attached depending on endpoint
      const author = anyP.author || anyP.user || anyP.owner || {};
      // Some endpoints may return flat fields referencing the post author
      const flatNickname = anyP.author_nickname || anyP.user_nickname || anyP.nickname;
      const flatFirst = anyP.author_first_name || anyP.user_first_name || anyP.first_name;
      const flatLast = anyP.author_last_name || anyP.user_last_name || anyP.last_name;
      const flatAvatar = anyP.author_avatar || anyP.user_avatar || anyP.avatar;

      return {
        ...p,
        author_id: p.author_id || p.user_id || author.id,
        author_nickname:
          p.author_nickname || author.nickname || flatNickname || fallback?.nickname || p.author_nickname,
        author_first_name:
          p.author_first_name || author.first_name || flatFirst || fallback?.first_name || p.author_first_name,
        author_last_name:
          p.author_last_name || author.last_name || flatLast || fallback?.last_name || p.author_last_name,
        author_avatar:
          p.author_avatar || author.avatar || flatAvatar || fallback?.avatar || p.author_avatar,
      } as Post;
    });
  };

  useEffect(() => {
    const loadPosts = async () => {
      if (!profileUser) return;

      setLoadingPosts(true);
      try {
        const targetUserId = userId ? parseInt(userId) : user?.id || 0;

        // Check if we should load posts based on privacy settings
        const shouldLoadPosts = () => {
          if (!profileUser) return false;

          // If viewing own profile, always load posts (requires authentication)
          if (isOwnProfile()) {
            return !!user; // Only if authenticated
          }

          // If viewing other user's profile
          if (userId && user) {
            // If profile is private and user is not following, don't load posts
            if (profileUser.is_private && !isFollowing) {
              return false;
            }
            // If profile is public or user is following, load posts
            return true;
          }

          // If not logged in and viewing private profile, don't load posts
          if (!user && profileUser.is_private) {
            return false;
          }

          // Default: load posts for public profiles (even if not logged in)
          return !profileUser.is_private;
        };

        if (!shouldLoadPosts()) {
          setUserPosts([]);
          setLikedPosts([]);
          setCommentedPosts([]);
          setLoadingPosts(false);
          return;
        }

        // Load user's posts
        const postsData = await postApi.getPostsByUser(targetUserId);
        setUserPosts(normalizePosts(postsData || [], profileUser));

        // Load liked posts (only for authenticated users)
        if (user) {
          if (!userId || userId === user.id.toString()) {
            const likedData = await postApi.getLikedPosts();
            setLikedPosts(normalizePosts(likedData || []));

            // Load commented posts (only for own profile – with or without explicit userId matching current user)
            if (!userId || userId === user.id.toString()) {
              const commentedData = await postApi.getCommentedPosts();
              setCommentedPosts(normalizePosts(commentedData || []));
            } else {
              setCommentedPosts([]);
            }
          } else {
            // For other users, try to get their liked posts if API supports it
            try {
              const likedData = await postApi.getLikedPostsByUser(targetUserId);
              setLikedPosts(normalizePosts(likedData || []));
            } catch (error) {
              console.log('Cannot load liked posts for other users');
              setLikedPosts([]);
            }

            // For other users, try to get their commented posts if API supports it
            try {
              const commentedData = await postApi.getCommentedPostsByUser(
                targetUserId,
              );
              setCommentedPosts(normalizePosts(commentedData || []));
            } catch (error) {
              console.log('Cannot load commented posts for other users');
              setCommentedPosts([]);
            }
          }
        } else {
          // Not logged in - can only see user's posts, not liked/commented
          setLikedPosts([]);
          setCommentedPosts([]);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
        setUserPosts([]);
        setLikedPosts([]);
        setCommentedPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    // Load posts if we have profile data and either:
    // 1. We're viewing someone else's profile (userId exists)
    // 2. We're authenticated and viewing our own profile
    if (profileUser && (userId || (hasCheckedAuth && !isLoading && user))) {
      loadPosts();
    }
  }, [profileUser, isFollowing, user, hasCheckedAuth, isLoading, userId]);

  // Set isFollowing to true when viewing own profile
  useEffect(() => {
    if (isOwnProfile() && profileUser) {
      setIsFollowing(true); // You always "follow" yourself
    }
  }, [user, userId, profileUser]);

  // Initialize isFollowing from profile data when viewing someone else
  useEffect(() => {
    if (profileUser && !isOwnProfile() && typeof (profileUser as any).isFollowing !== 'undefined') {
      setIsFollowing(!!(profileUser as any).isFollowing);
    }
  }, [profileUser, userId]);

  // Show loading only if we're authenticated and still checking auth, or if we're loading
  if ((user && (!hasCheckedAuth || isLoading)) || (!user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  // Allow unauthenticated users to view other users' profiles
  // Only require authentication for own profile (when userId is not provided)
  if (!user && !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">
          You must be logged in to view your profile.
        </p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading profile data...</p>
      </div>
    );
  }

  const handleChange = (
    field: keyof UpdateUserRequest,
    value: string | boolean,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Upload avatar first if there's a new one
      let avatarUrl = profileUser?.avatar;
      if (avatarFile) {
        try {
          const { url } = await uploadAvatar(avatarFile);
          avatarUrl = url;
          // Update the profile user with new avatar URL
          setProfileUser((prev) =>
            prev ? { ...prev, avatar: url } : prev,
          );
          // Clean up preview
          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
          setAvatarFile(null);
        } catch (e: any) {
          setErrorModal({
            isOpen: true,
            title: 'Erreur de téléchargement',
            message: e?.message || "Erreur lors de la mise à jour de l'avatar",
          });
          return; // Don't proceed with profile update if avatar upload fails
        }
      }

      const payload: UpdateUserRequest = {
        first_name: formState.first_name,
        last_name: formState.last_name,
        nickname: formState.nickname,
        bio: formState.bio,
        is_private: formState.is_private,
      };

      await userApi.updateProfile(payload);
      // Rafraîchir uniquement le profil local sans toucher à l'état d'auth global
      try {
        const refreshed = await userApi.getProfile();
        setProfileUser(refreshed);
        setFormState({
          first_name: refreshed.first_name,
          last_name: refreshed.last_name,
          nickname: refreshed.nickname,
          bio: refreshed.bio || '',
          is_private: refreshed.is_private,
        });
      } catch (e) {
        // fallback silencieux: on ne casse pas la session même si la requête échoue
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormState({
      first_name: profileUser.first_name,
      last_name: profileUser.last_name,
      nickname: profileUser.nickname,
      bio: profileUser.bio || '',
      is_private: profileUser.is_private,
    });
    setIsEditing(false);
    setError(null);
    // reset avatar selection
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleFollowersClick = async () => {
    try {
      const targetUserId = userId ? parseInt(userId) : user?.id || 0;
      if (!targetUserId) return;
      const followersData = await userApi.getFollowers(targetUserId);
      setFollowers(followersData || []);
      setFollowersModal({ isOpen: true, type: 'followers' });
    } catch (error) {
      console.error('Error loading followers:', error);
      setFollowers([]);
      setFollowersModal({ isOpen: true, type: 'followers' });
    }
  };

  const handleFollowingClick = async () => {
    try {
      const targetUserId = userId ? parseInt(userId) : user?.id || 0;
      if (!targetUserId) return;
      const followingData = await userApi.getFollowing(targetUserId);
      setFollowing(followingData || []);
      setFollowersModal({ isOpen: true, type: 'following' });
    } catch (error) {
      console.error('Error loading following:', error);
      setFollowing([]);
      setFollowersModal({ isOpen: true, type: 'following' });
    }
  };

  const handleUserClick = (userId: number) => {
    // Navigate to user profile
    router.push(`/profile?userId=${userId}`);
    setFollowersModal({ isOpen: false, type: 'followers' });
  };

  const handleFollowToggle = async () => {
    if (!userId || !user) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await userApi.unfollowUser(parseInt(userId));
        setIsFollowing(false);
        // Update followers count
        if (profileUser) {
          setProfileUser({
            ...profileUser,
            followers: profileUser.followers - 1,
          });
        }
      } else {
        await userApi.followUser(parseInt(userId));
        setIsFollowing(true);
        // Update followers count
        if (profileUser) {
          setProfileUser({
            ...profileUser,
            followers: profileUser.followers + 1,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Post interaction handlers
  const handleViewDetails = (postId: number) => {
    const allPosts = [...userPosts, ...likedPosts, ...commentedPosts];
    const post = allPosts.find((p) => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setSelectedPost(null);

    // Refresh posts when closing modal
    try {
      const targetUserId = userId ? parseInt(userId) : user?.id;
      if (!targetUserId) return;

      const postsData = await postApi.getPostsByUser(targetUserId);
      setUserPosts(normalizePosts(postsData || [], profileUser));

      if (!userId || userId === user?.id?.toString()) {
        const likedData = await postApi.getLikedPosts();
        setLikedPosts(normalizePosts(likedData || []));

        if (!userId || userId === user?.id?.toString()) {
          const commentedData = await postApi.getCommentedPosts();
          setCommentedPosts(normalizePosts(commentedData || []));
        }
      }
    } catch (error) {
      console.error('Error refreshing posts after modal close:', error);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const targetUserId = userId ? parseInt(userId) : user?.id;
      if (!targetUserId) return;

      const postsData = await postApi.getPostsByUser(targetUserId);
      setUserPosts(normalizePosts(postsData || [], profileUser));

      if (!userId || userId === user?.id?.toString()) {
        const likedData = await postApi.getLikedPosts();
        setLikedPosts(normalizePosts(likedData || []));

        if (!userId || userId === user?.id?.toString()) {
          const commentedData = await postApi.getCommentedPosts();
          setCommentedPosts(normalizePosts(commentedData || []));
        }
      }

      if (selectedPost?.id === postId) {
        const allPosts = [...userPosts, ...likedPosts, ...commentedPosts];
        const updatedPost = allPosts.find((p) => p.id === postId);
        if (updatedPost) {
          setSelectedPost(updatedPost);
        }
      }
    } catch (error) {
      console.error('Error refreshing posts after like:', error);
    }
  };

  const handleComment = (postId: number) => {
    handleViewDetails(postId);
  };

  // Check if user can view posts sections
  const canViewPosts = () => {
    if (!profileUser) return false;

    // If viewing own profile, always show posts (requires authentication)
    if (isOwnProfile()) return !!user;

    // If viewing other user's profile
    if (userId && user) {
      // If profile is private and user is not following, don't show posts
      if (profileUser.is_private && !isFollowing) {
        return false;
      }
      // If profile is public or user is following, show posts
      return true;
    }

    // If not logged in and viewing private profile, don't show posts
    if (!user && profileUser.is_private) {
      return false;
    }

    // Default: show posts for public profiles (even if not logged in)
    return !profileUser.is_private;
  };

  return (
    <div className="max-w-4xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start gap-4">
            {/* Avatar - Always visible */}
            <div className="flex-shrink-0">
              <Avatar
                src={avatarPreview || profileUser.avatar}
                alt={`${profileUser.first_name} ${profileUser.last_name}`}
                fallback={profileUser.nickname?.charAt(0) || 'U'}
                size="xl"
              />
            </div>

            {/* Profile Content */}
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
                            setErrorModal({
                              isOpen: true,
                              title,
                              message
                            });
                          }}
                        />
                      </div>
                    </div>
                  </ModernSection>

                  {/* Personal Information */}
                  <ModernSection title="Personal Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ModernInput
                        type="text"
                        value={formState.first_name}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                        placeholder="First Name"
                      />
                      <ModernInput
                        type="text"
                        value={formState.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        placeholder="Last Name"
                      />
                    </div>
                    <ModernInput
                      type="text"
                      value={formState.nickname}
                      onChange={(e) => handleChange('nickname', e.target.value)}
                      placeholder="Nickname"
                    />
                  </ModernSection>

                  {/* Bio */}
                  <ModernSection title="Bio">
                    <ModernTextarea
                      rows={3}
                      value={formState.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                    />
                  </ModernSection>

                  {/* Privacy Settings */}
                  <ModernSection title="Privacy Settings">
                    <ModernCheckbox
                      checked={formState.is_private}
                      onChange={(e) => handleChange('is_private', e.target.checked)}
                      label="Private Profile"
                      icon={
                        formState.is_private ? (
                          <Lock className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Unlock className="w-4 h-4 text-green-500" />
                        )
                      }
                    />
                  </ModernSection>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Name and Username */}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-card-foreground">
                      {profileUser.first_name} {profileUser.last_name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <p className="text-lg text-muted-foreground">@{profileUser.nickname}</p>
                      {profileUser.is_private ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                          <Lock className="w-3 h-3 text-orange-600" />
                          <span className="text-xs text-orange-600 font-medium">Private</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <Unlock className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Public</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-card-foreground">Bio</h3>
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <p className="text-card-foreground leading-relaxed">
                        {profileUser.bio || 'No bio available yet.'}
                      </p>
                    </div>
                  </div>


                  {/* Additional Info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-card-foreground">Member Since</h3>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border">
                      <p className="text-sm text-card-foreground">
                        {profileUser.created_at && !isNaN(new Date(profileUser.created_at).getTime()) 
                          ? new Date(profileUser.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isOwnProfile() && (
              <div className="flex justify-end">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      variant="outline"
                      size="default"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="default"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="default"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            )}

            {userId && user && parseInt(userId) !== user.id && (
              <div className="flex justify-end">
                <Button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  variant={isFollowing ? 'secondary' : 'default'}
                  size="default"
                >
                  {isFollowLoading ? (
                    'Loading...'
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        {/* Profile Stats */}
        <div className="bg-card rounded-lg border border-border p-6">
          {/* <h3 className="text-lg font-semibold text-card-foreground mb-4">Social Stats</h3> */}
          <div className="grid grid-cols-2 gap-6">
            <div
              className="text-center cursor-pointer hover:bg-accent/50 transition-colors p-4 rounded-lg group"
              onClick={handleFollowingClick}
            >
              <div className="text-3xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                {profileUser?.followed || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Following</div>
              <div className="text-xs text-muted-foreground/70 mt-1">People they follow</div>
            </div>
            <div
              className="text-center cursor-pointer hover:bg-accent/50 transition-colors p-4 rounded-lg group"
              onClick={handleFollowersClick}
            >
              <div className="text-3xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                {profileUser?.followers || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Followers</div>
              <div className="text-xs text-muted-foreground/70 mt-1">People following them</div>
            </div>
          </div>
        </div>

        {/* Posts Tabs Section - Only show if user can view posts */}
        {canViewPosts() ? (
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
              {/* Only show Liked and Commented tabs for authenticated users */}
              {user && (
                <>
                  <button
                    onClick={() => setActiveTab('liked')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'liked'
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Liked
                  </button>
                  <button
                    onClick={() => setActiveTab('commented')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'commented'
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Commented
                  </button>
                </>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'posts' && (
              <>
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading posts...</span>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-lg">No posts yet.</p>
                    <p className="text-muted-foreground/70 text-sm mt-2">
                      {userId
                        ? "This user hasn't posted anything yet."
                        : 'Create your first post to get started!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onViewDetails={handleViewDetails}
                        onUserClick={handleUserClick}
                        disableLikes={!user}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Only show Liked and Commented tabs for authenticated users */}
            {user && activeTab === 'liked' && (
              <>
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">
                      Loading liked posts...
                    </span>
                  </div>
                ) : likedPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-lg">No liked posts yet.</p>
                    <p className="text-muted-foreground/70 text-sm mt-2">
                      {userId
                        ? "This user hasn't liked any posts yet."
                        : 'Like some posts to see them here!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {likedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onViewDetails={handleViewDetails}
                        onUserClick={handleUserClick}
                        disableLikes={!user}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {user && activeTab === 'commented' && (
              <>
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">
                      Loading commented posts...
                    </span>
                  </div>
                ) : commentedPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-lg">
                      No commented posts yet.
                    </p>
                    <p className="text-muted-foreground/70 text-sm mt-2">
                      {userId
                        ? "This user hasn't commented on any posts yet."
                        : 'Comment on some posts to see them here!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {commentedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onViewDetails={handleViewDetails}
                        onUserClick={handleUserClick}
                        disableLikes={!user}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Private Profile Message */
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                This profile is private
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {!user
                  ? 'Sign in to follow this user and see their posts, liked content, and comments.'
                  : userId
                  ? 'Follow this user to see their posts, liked content, and comments.'
                  : "This user's posts are only visible to their followers."}
              </p>
              {!user ? (
                <div className="space-y-2">
                  <a
                    href="/login"
                    className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Sign In
                  </a>
                  <p className="text-xs text-muted-foreground">or</p>
                  <a
                    href="/register"
                    className="inline-block px-4 py-2 border border-border text-card-foreground rounded-lg hover:bg-accent transition-colors"
                  >
                    Create Account
                  </a>
                </div>
              ) : (
                !isOwnProfile() &&
                user &&
                !isFollowing && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isFollowLoading ? 'Loading...' : 'Follow to see content'}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={followersModal.isOpen}
        onClose={() => setFollowersModal({ isOpen: false, type: 'followers' })}
        users={followersModal.type === 'followers' ? followers : following}
        title={followersModal.type === 'followers' ? 'Followers' : 'Following'}
        onUserClick={handleUserClick}
        isOwnProfile={isOwnProfile()}
      />

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
        disableInteractions={!user}
        isAuthenticated={!!user}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
