'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Lock } from 'lucide-react';

export default function DevAccessDenied() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // Clear the error from URL after showing the message
    if (error === 'dev-access-denied') {
      const timer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        router.replace(url.pathname);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, router]);

  if (error !== 'dev-access-denied') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Development Access Denied
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Development pages are only accessible in development environment.
              </p>
              <p className="mt-1 text-xs">
                Current environment: <code className="bg-red-100 px-1 rounded">{process.env.NODE_ENV || 'unknown'}</code>
              </p>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('error');
                  router.replace(url.pathname);
                }}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
