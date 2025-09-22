'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePostModal } from '@/components/CreatePostModal';

export default function CreatePostPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    router.push('/');
  };

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background content to prevent white screen */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6">Create Post</h1>
          <p className="text-muted-foreground">Create a new post to share with your community.</p>
        </div>
      </div>
      
      <CreatePostModal
        isOpen={showModal}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
