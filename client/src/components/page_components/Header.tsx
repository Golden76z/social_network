'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const { logout, isAuthenticated, user, hasCheckedAuth, isLoading } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show loading skeleton while checking auth
  const renderAuthSection = () => {
    if (!hasCheckedAuth || isLoading) {
      return (
        <div className="flex items-center gap-3">
          {/* Loading skeleton */}
          <div className="w-20 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <>
          <Link
            href="/posts/create"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            ✏️ Post
          </Link>

          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.nickname?.charAt(0) || user?.first_name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.nickname || user?.first_name || 'User'}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-4 top-16 mt-1 w-40 rounded-md border border-border bg-popover shadow-md p-1 z-50">
              <Link
                href="/profile"
                className="block px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                👤 Profile
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </>
      );
    }

    return (
      <button
        onClick={() => router.push('/login')}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
      >
        🔐 Sign In
      </button>
    );
  };

  const renderMobileAuthSection = () => {
    if (!hasCheckedAuth || isLoading) {
      return (
        <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      );
    }

    if (isAuthenticated) {
      return (
        <>
          <Link
            href="/posts/create"
            className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors text-center"
          >
            ✏️ Post
          </Link>
          <Link
            href="/profile"
            className="block w-full px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors text-center"
          >
            👤 Profile
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="block w-full text-center px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            🚪 Logout
          </button>
        </>
      );
    }

    return (
      <button
        onClick={() => {
          setMobileMenuOpen(false);
          router.push('/login');
        }}
        className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors text-center"
      >
        🔐 Sign In
      </button>
    );
  };

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - empty for centering */}
          <div className="flex-1"></div>

          {/* Center - Logo and Search bar */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <Link href="/" className="font-bold text-3xl text-purple-600">
              Deustagram
            </Link>
            <div className="hidden md:block w-full max-w-md">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-1.5 border border-border rounded-md bg-background text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Right side - Menu */}
          <div className="flex-1 flex justify-end">
            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-3" ref={dropdownRef}>
              {renderAuthSection()}
            </div>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-md border border-border"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-2">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {renderMobileAuthSection()}
        </div>
      )}
    </header>
  );
}