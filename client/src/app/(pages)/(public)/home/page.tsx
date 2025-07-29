'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { usePosts } from '@/lib/hooks/usePosts';
import { PostCard } from '@/components/PostCard';
import { CreatePostForm } from '@/components/CreatePostForm';
import { CreatePostRequest } from '@/services/posts';
import Layout from '@/components/ui/layout';
import Button from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    posts,
    isLoading,
    error,
    hasMore,
    createPost,
    refreshPosts,
    loadMorePosts,
  } = usePosts(10);

  const [showCreateForm, setShowCreateForm] = useState(false);

  // Gérer la création d'un post
  const handleCreatePost = async (postData: CreatePostRequest) => {
    try {
      await createPost(postData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
    }
  };

  // Gérer la suppression d'un post
  const handleDeletePost = (postId: number) => {
    console.log('Post supprimé:', postId);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="w-full md:w-[70%] px-4 md:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Bienvenue sur Social Network
            </h1>
            <p className="text-gray-600 mb-4">
              Connectez-vous pour voir les posts de vos amis et partager vos
              pensées.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Main Feed - full width on mobile */}
      <div className="w-full md:w-[70%] px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Bon retour, {user?.nickname || user?.first_name} !
          </h1>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPosts}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </Button>

            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau post
            </Button>
          </div>
        </div>

        {/* Formulaire de création de post */}
        {showCreateForm && (
          <CreatePostForm
            onSubmit={handleCreatePost}
            onCancel={() => setShowCreateForm(false)}
            isLoading={isLoading}
          />
        )}

        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Liste des posts */}
        <div className="space-y-6">
          {isLoading && posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Aucun post pour le moment.</p>
              <p className="text-sm text-gray-500">
                Soyez le premier à partager quelque chose !
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDeletePost}
                />
              ))}

              {/* Bouton "Charger plus" */}
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={loadMorePosts}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Chargement...' : 'Charger plus de posts'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
