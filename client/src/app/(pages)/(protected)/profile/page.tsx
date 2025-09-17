'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { userApi } from '@/lib/api/user';
import { postApi } from '@/lib/api/post';
import { UpdateUserRequest, UserProfile, UserDisplayInfo } from '@/lib/types';
import { Post } from '@/lib/types/post';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';
import Header from '@/components/header';
import { SideBarLeft } from '@/components/SideBarLeft';
import { SideBarRight } from '@/components/SideBarRight';
import { Users, Lock, Unlock, UserMinus, UserPlus } from 'lucide-react';

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

export default function ProfilePage() {
  const { user, isLoading, hasCheckedAuth, checkAuth } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'commented'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Load posts when tab changes
  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return;
      
      setLoadingPosts(true);
      try {
        if (activeTab === 'posts') {
          if (userId) {
            // Load other user's posts
            const postsData = await postApi.getPostsByUser(parseInt(userId));
            setPosts(postsData);
          } else {
            // Load own posts
            const postsData = await postApi.getMyPosts();
            setPosts(postsData);
          }
        } else if (activeTab === 'liked') {
          if (userId) {
            // Load other user's liked posts
            const likedData = await postApi.getLikedPostsByUser(parseInt(userId));
            setLikedPosts(likedData);
          } else {
            // Load own liked posts
            const likedData = await postApi.getLikedPosts();
            setLikedPosts(likedData);
          }
        } else if (activeTab === 'commented') {
          if (userId) {
            // Load other user's commented posts
            const commentedData = await postApi.getCommentedPostsByUser(parseInt(userId));
            setCommentedPosts(commentedData);
          } else {
            // Load own commented posts
            const commentedData = await postApi.getCommentedPosts();
            setCommentedPosts(commentedData);
          }
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [activeTab, user, userId]);

  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
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

  const handleViewDetails = (postId: number) => {
    let post: Post | undefined;
    if (activeTab === 'posts') {
      post = posts.find(p => p.id === postId);
    } else if (activeTab === 'liked') {
      post = likedPosts.find(p => p.id === postId);
    } else if (activeTab === 'commented') {
      post = commentedPosts.find(p => p.id === postId);
    }
    
    if (post) {
      setSelectedPost(post);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleLike = async (postId: number) => {
    // Refresh posts after like
    try {
      if (activeTab === 'posts') {
        const updatedPosts = await postApi.getMyPosts();
        setPosts(updatedPosts);
      } else if (activeTab === 'liked') {
        const updatedLikedPosts = await postApi.getLikedPosts();
        setLikedPosts(updatedLikedPosts);
      } else if (activeTab === 'commented') {
        const updatedCommentedPosts = await postApi.getCommentedPosts();
        setCommentedPosts(updatedCommentedPosts);
      }
      
      if (selectedPost?.id === postId) {
        let updatedPost: Post | undefined;
        if (activeTab === 'posts') {
          updatedPost = posts.find(p => p.id === postId);
        } else if (activeTab === 'liked') {
          updatedPost = likedPosts.find(p => p.id === postId);
        } else if (activeTab === 'commented') {
          updatedPost = commentedPosts.find(p => p.id === postId);
        }
        
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

  const handleFollowersClick = async () => {
    try {
      const followersData = await userApi.getFollowers(user.id);
      setFollowers(followersData);
      setFollowersModal({isOpen: true, type: 'followers'});
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const handleFollowingClick = async () => {
    try {
      const followingData = await userApi.getFollowing(user.id);
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
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{posts?.length || 0}</div>
                  <div className="text-sm text-gray-500">Posts</div>
                </div>
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

            {/* Posts/Liked Posts/Commented Posts Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === 'posts'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('liked')}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === 'liked'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Liked Posts
                </button>
                <button
                  onClick={() => setActiveTab('commented')}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === 'commented'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Commented Posts
                </button>
              </div>

              <div className="p-6">
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">Loading {activeTab}...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      let currentPosts: Post[] = [];
                      let emptyMessage = '';
                      let emptySubMessage = '';
                      
                      if (activeTab === 'posts') {
                        currentPosts = posts;
                        emptyMessage = 'No posts yet.';
                        emptySubMessage = 'Create your first post to get started!';
                      } else if (activeTab === 'liked') {
                        currentPosts = likedPosts;
                        emptyMessage = 'No liked posts yet.';
                        emptySubMessage = 'Like some posts to see them here!';
                      } else if (activeTab === 'commented') {
                        currentPosts = commentedPosts;
                        emptyMessage = 'No commented posts yet.';
                        emptySubMessage = 'Comment on some posts to see them here!';
                      }
                      
                      return currentPosts.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 text-lg">{emptyMessage}</p>
                          <p className="text-gray-400 text-sm mt-2">{emptySubMessage}</p>
                        </div>
                      ) : (
                        currentPosts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLike={handleLike}
                            onComment={handleComment}
                            onViewDetails={handleViewDetails}
                            onUserClick={handleUserClick}
                            disableLikes={!!userId} // Disable likes when viewing other users' profiles
                          />
                        ))
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
      </div>

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
      />

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={followersModal.isOpen}
        onClose={() => setFollowersModal({isOpen: false, type: 'followers'})}
        users={followersModal.type === 'followers' ? followers : following}
        title={followersModal.type === 'followers' ? 'Followers' : 'Following'}
        onUserClick={handleUserClick}
      />
    </div>
  );
}
