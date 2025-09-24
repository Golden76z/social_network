'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the home page which has the proper layout
    router.replace('/home');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <LoadingSpinner 
        size="lg" 
        text="Redirecting..." 
      />
    </div>
  );
}