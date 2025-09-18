'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { userApi } from '@/lib/api/user';
import { postApi } from '@/lib/api/post';
import { UpdateUserRequest, UserProfile, UserDisplayInfo, Post } from '@/lib/types';
import { Lock, Unlock, UserMinus, UserPlus } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserDisplayInfo[];
  title: string;
  onUserClick: (userId: number) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ isOpen, onClose, users, title, onUserClick }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key and click outside
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No {title.toLowerCase()} yet.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onUserClick(user.id)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.nickname?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{user.fullName}</p>
                    <p className="text-xs text-gray-500">@{user.nickname}</p>
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
  const [followersModal, setFollowersModal] = useState<{isOpen: boolean, type: 'followers' | 'following'}>({isOpen: false, type: 'followers'});
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

  // Posts sections state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'commented'>('posts');

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        let profileData;
        if (userId) {
          // Load other user's profile
          profileData = await userApi.getUserById(parseInt(userId));
        } else {
          // Load own profile
          profileData = await userApi.getProfile();
        }
        setProfileUser(profileData);
        setFormState({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          nickname: profileData.nickname,
          bio: profileData.bio || '',
          is_private: profileData.is_private,
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (hasCheckedAuth && !isLoading && user) {
      loadProfile();
    }
  }, [user, hasCheckedAuth, isLoading, userId]);

  // Load posts after profile data is loaded
  useEffect(() => {
    const loadPosts = async () => {
      if (!user || !profileUser) return;
      
      setLoadingPosts(true);
      try {
        const targetUserId = userId ? parseInt(userId) : user.id;
        
        // Check if we should load posts based on privacy settings
        const shouldLoadPosts = () => {
          if (!profileUser) return false;
          
          // If viewing own profile, always load posts
          if (!userId) return true;
          
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
          
          // Default: load posts for public profiles
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
        setUserPosts(postsData || []);
        
        // Load liked posts (only for own profile or if viewing other user's profile)
        if (!userId || userId === user.id.toString()) {
          const likedData = await postApi.getLikedPosts();
          setLikedPosts(likedData || []);
          
          // Load commented posts (only for own profile)
          if (!userId) {
            const commentedData = await postApi.getCommentedPosts();
            setCommentedPosts(commentedData || []);
          } else {
            setCommentedPosts([]);
          }
        } else {
          // For other users, try to get their liked posts if API supports it
          try {
            const likedData = await postApi.getLikedPostsByUser(targetUserId);
            setLikedPosts(likedData || []);
          } catch (error) {
            console.log('Cannot load liked posts for other users');
            setLikedPosts([]);
          }
          
          // For other users, try to get their commented posts if API supports it
          try {
            const commentedData = await postApi.getCommentedPostsByUser(targetUserId);
            setCommentedPosts(commentedData || []);
          } catch (error) {
            console.log('Cannot load commented posts for other users');
            setCommentedPosts([]);
          }
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

    if (profileUser && hasCheckedAuth && !isLoading && user) {
      loadPosts();
    }
  }, [profileUser, isFollowing, user, hasCheckedAuth, isLoading, userId]);


  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading your profile...</p>
      </div>
    );
  }

  // Allow unauthenticated users to view other users' profiles
  // Only require authentication for own profile (when userId is not provided)
  if (!user && !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">You must be logged in to view your profile.</p>
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

  const handleChange = (field: keyof UpdateUserRequest, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: UpdateUserRequest = {
        first_name: formState.first_name,
        last_name: formState.last_name,
        nickname: formState.nickname,
        bio: formState.bio,
        is_private: formState.is_private,
      };

      await userApi.updateProfile(payload);
      await checkAuth(); // refresh context state
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
  };


  const handleFollowersClick = async () => {
    try {
      const targetUserId = userId ? parseInt(userId) : (user?.id || 0);
      if (!targetUserId) return;
      const followersData = await userApi.getFollowers(targetUserId);
      setFollowers(followersData);
      setFollowersModal({isOpen: true, type: 'followers'});
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const handleFollowingClick = async () => {
    try {
      const targetUserId = userId ? parseInt(userId) : (user?.id || 0);
      if (!targetUserId) return;
      const followingData = await userApi.getFollowing(targetUserId);
      setFollowing(followingData);
      setFollowersModal({isOpen: true, type: 'following'});
    } catch (error) {
      console.error('Error loading following:', error);
    }
  };

  const handleUserClick = (userId: number) => {
    // Navigate to user profile
    router.push(`/profile?userId=${userId}`);
    setFollowersModal({isOpen: false, type: 'followers'});
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
          setProfileUser({...profileUser, followers: profileUser.followers - 1});
        }
      } else {
        await userApi.followUser(parseInt(userId));
        setIsFollowing(true);
        // Update followers count
        if (profileUser) {
          setProfileUser({...profileUser, followers: profileUser.followers + 1});
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
    const post = allPosts.find(p => p.id === postId);
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
      setUserPosts(postsData || []);
      
      if (!userId || userId === user?.id?.toString()) {
        const likedData = await postApi.getLikedPosts();
        setLikedPosts(likedData || []);
        
        if (!userId) {
          const commentedData = await postApi.getCommentedPosts();
          setCommentedPosts(commentedData || []);
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
      setUserPosts(postsData || []);
      
      if (!userId || userId === user?.id?.toString()) {
        const likedData = await postApi.getLikedPosts();
        setLikedPosts(likedData || []);
        
        if (!userId) {
          const commentedData = await postApi.getCommentedPosts();
          setCommentedPosts(commentedData || []);
        }
      }
      
      if (selectedPost?.id === postId) {
        const allPosts = [...userPosts, ...likedPosts, ...commentedPosts];
        const updatedPost = allPosts.find(p => p.id === postId);
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
    
    // If viewing own profile, always show posts
    if (!userId) return true;
    
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
    
    // Default: show posts for public profiles
    return !profileUser.is_private;
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">
        {userId ? `${profileUser?.nickname || 'User'}'s Profile` : 'Your Profile'}
      </h1>

      <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                  {profileUser.nickname?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 space-y-2">
                  {isEditing ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-lg font-semibold"
                          value={formState.first_name}
                          onChange={(e) => handleChange('first_name', e.target.value)}
                          placeholder="First Name"
                        />
                        <input
                          type="text"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-lg font-semibold"
                          value={formState.last_name}
                          onChange={(e) => handleChange('last_name', e.target.value)}
                          placeholder="Last Name"
                        />
                      </div>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-600"
                        value={formState.nickname}
                        onChange={(e) => handleChange('nickname', e.target.value)}
                        placeholder="Nickname"
                      />
                      <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={formState.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Bio"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formState.is_private}
                            onChange={(e) => handleChange('is_private', e.target.checked)}
                            className="rounded"
                          />
                          <span className="flex items-center gap-1">
                            {formState.is_private ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            Private Profile
                          </span>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold">
                        {profileUser.first_name} {profileUser.last_name}
                      </h2>
                      <p className="text-gray-600">@{profileUser.nickname}</p>
                      <p className="text-sm text-gray-700">{profileUser.bio || 'No bio yet.'}</p>
                      <div className="flex items-center gap-2 text-sm">
                        {profileUser.is_private ? (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Lock className="w-4 h-4" />
                            Private Profile
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600">
                            <Unlock className="w-4 h-4" />
                            Public Profile
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!userId && (
                  <>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </button>
                    )}
                  </>
                )}
                
                {userId && user && parseInt(userId) !== user.id && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isFollowLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Loading...</span>
                      </>
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
                  </button>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
            </div>

            {/* Profile Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="text-center cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={handleFollowingClick}
                >
                  <div className="text-2xl font-bold">{profileUser?.followed || 0}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={handleFollowersClick}
                >
                  <div className="text-2xl font-bold">{profileUser?.followers || 0}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
              </div>
            </div>

            {/* Posts Tabs Section - Only show if user can view posts */}
            {canViewPosts() ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Tab Buttons */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'posts'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setActiveTab('liked')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'liked'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Liked
                  </button>
                  <button
                    onClick={() => setActiveTab('commented')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'commented'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Commented
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'posts' && (
                  <>
                    {loadingPosts ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-500">Loading posts...</span>
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No posts yet.</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {userId ? "This user hasn't posted anything yet." : "Create your first post to get started!"}
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

                {activeTab === 'liked' && (
                  <>
                    {loadingPosts ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-500">Loading liked posts...</span>
                      </div>
                    ) : likedPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No liked posts yet.</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {userId ? "This user hasn't liked any posts yet." : "Like some posts to see them here!"}
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

                {activeTab === 'commented' && (
                  <>
                    {loadingPosts ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-500">Loading commented posts...</span>
                      </div>
                    ) : commentedPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No commented posts yet.</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {userId ? "This user hasn't commented on any posts yet." : "Comment on some posts to see them here!"}
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">This profile is private</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {userId ? 
                      "Follow this user to see their posts, liked content, and comments." : 
                      "This user's posts are only visible to their followers."
                    }
                  </p>
                  {userId && user && parseInt(userId) !== user.id && !isFollowing && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {isFollowLoading ? 'Loading...' : 'Follow to see content'}
                    </button>
                  )}
                </div>
              </div>
            )}

      </div>


      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={followersModal.isOpen}
        onClose={() => setFollowersModal({isOpen: false, type: 'followers'})}
        users={followersModal.type === 'followers' ? followers : following}
        title={followersModal.type === 'followers' ? 'Followers' : 'Following'}
        onUserClick={handleUserClick}
      />

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
        disableInteractions={!user}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 text-lg">Loading...</p></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
