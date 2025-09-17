'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { userApi } from '@/lib/api/user';
import { postApi } from '@/lib/api/post';
import { UserProfile, UserDisplayInfo } from '@/lib/types';
import { Post } from '@/lib/types/post';
import { PostCard } from '@/components/PostCard';
import { PostModal } from '@/components/PostModal';
import Header from '@/components/header';
import { SideBarLeft } from '@/components/SideBarLeft';
import { SideBarRight } from '@/components/SideBarRight';
import { Lock, Unlock, Users, UserPlus, UserMinus } from 'lucide-react';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserDisplayInfo[];
  title: string;
  onUserClick: (userId: number) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ isOpen, onClose, users, title, onUserClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
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

export default function UserProfilePage() {
  const { user: currentUser, isLoading, hasCheckedAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.userId as string);
  
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followersModal, setFollowersModal] = useState<{isOpen: boolean, type: 'followers' | 'following'}>({isOpen: false, type: 'followers'});
  const [followers, setFollowers] = useState<UserDisplayInfo[]>([]);
  const [following, setFollowing] = useState<UserDisplayInfo[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser || !userId) return;
      
      try {
        const profileData = await userApi.getUserById(userId);
        setProfileUser(profileData);
        setIsFollowing(profileData.isFollowing || false);
      } catch (error) {
        console.error('Error loading profile:', error);
        router.push('/profile'); // Redirect to own profile if user not found
      }
    };

    if (hasCheckedAuth && !isLoading && currentUser) {
      loadProfile();
    }
  }, [userId, currentUser, hasCheckedAuth, isLoading, router]);

  // Load posts when tab changes
  useEffect(() => {
    const loadPosts = async () => {
      if (!userId) return;
      
      setLoadingPosts(true);
      try {
        if (activeTab === 'posts') {
          const postsData = await postApi.getPostsByUser(userId);
          setPosts(postsData);
        } else {
          // For liked posts, we can only show our own liked posts
          if (userId === currentUser?.id) {
            const likedData = await postApi.getLikedPosts();
            setLikedPosts(likedData);
          } else {
            setLikedPosts([]); // Can't see other users' liked posts
          }
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [activeTab, userId, currentUser]);

  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">You must be logged in to view profiles.</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  const handleViewDetails = (postId: number) => {
    const post = activeTab === 'posts' 
      ? posts.find(p => p.id === postId)
      : likedPosts.find(p => p.id === postId);
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
        const updatedPosts = await postApi.getPostsByUser(userId);
        setPosts(updatedPosts);
      } else if (userId === currentUser.id) {
        const updatedLikedPosts = await postApi.getLikedPosts();
        setLikedPosts(updatedLikedPosts);
      }
      
      if (selectedPost?.id === postId) {
        const updatedPost = activeTab === 'posts' 
          ? posts.find(p => p.id === postId)
          : likedPosts.find(p => p.id === postId);
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
      const followersData = await userApi.getFollowers(userId);
      setFollowers(followersData);
      setFollowersModal({isOpen: true, type: 'followers'});
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const handleFollowingClick = async () => {
    try {
      const followingData = await userApi.getFollowing(userId);
      setFollowing(followingData);
      setFollowersModal({isOpen: true, type: 'following'});
    } catch (error) {
      console.error('Error loading following:', error);
    }
  };

  const handleUserClick = (userId: number) => {
    router.push(`/profile/${userId}`);
    setFollowersModal({isOpen: false, type: 'followers'});
  };

  const handleFollowToggle = async () => {
    if (!currentUser || userId === currentUser.id) return;
    
    setLoadingFollow(true);
    try {
      if (isFollowing) {
        await userApi.unfollowUser(userId);
        setIsFollowing(false);
        // Update followers count
        setProfileUser(prev => prev ? { ...prev, followers: prev.followers - 1 } : null);
      } else {
        await userApi.followUser(userId);
        setIsFollowing(true);
        // Update followers count
        setProfileUser(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoadingFollow(false);
    }
  };

  const isOwnProfile = userId === currentUser.id;
  const canViewPosts = !profileUser.is_private || isOwnProfile || isFollowing;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <div className="flex flex-col md:flex-row max-w-full mx-auto">
        <div className="hidden md:block w-[20%] min-h-screen bg-white border-r border-gray-200 p-4">
          <SideBarLeft variant="sidebar" />
        </div>

        <div className="w-full md:w-[70%] px-4 md:px-8 py-6">
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                  {profileUser.nickname?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 space-y-2">
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
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={loadingFollow}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } ${loadingFollow ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingFollow ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Profile Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{posts.length}</div>
                  <div className="text-sm text-gray-500">Posts</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={handleFollowingClick}
                >
                  <div className="text-2xl font-bold">{profileUser.followed}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={handleFollowersClick}
                >
                  <div className="text-2xl font-bold">{profileUser.followers}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
              </div>
            </div>

            {/* Posts/Liked Posts Tabs */}
            {canViewPosts ? (
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
                  {isOwnProfile && (
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
                  )}
                </div>

                <div className="p-6">
                  {loadingPosts ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500">Loading {activeTab}...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(activeTab === 'posts' ? posts : likedPosts).length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 text-lg">
                            {activeTab === 'posts' ? 'No posts yet.' : 'No liked posts yet.'}
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            {activeTab === 'posts' 
                              ? 'This user hasn\'t posted anything yet!' 
                              : 'This user hasn\'t liked any posts yet!'}
                          </p>
                        </div>
                      ) : (
                        (activeTab === 'posts' ? posts : likedPosts).map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLike={handleLike}
                            onComment={handleComment}
                            onViewDetails={handleViewDetails}
                            onUserClick={handleUserClick}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Private Profile</h3>
                <p className="text-gray-500 mb-4">
                  This user's posts are private. Follow them to see their content.
                </p>
                {!isFollowing && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={loadingFollow}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
                  >
                    {loadingFollow ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow to see posts
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block w-[20%] min-h-screen bg-white border-l border-gray-200 p-4">
          <SideBarRight />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white shadow-sm">
        <SideBarLeft variant="bottom" />
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
