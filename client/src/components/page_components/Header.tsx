'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import { ProfileThumbnail } from '@/components/layout/ProfileThumbnail';
import { ButtonAccept } from '@/components/ui/Button/buttonAccept';
import { 
  User, 
  LogOut, 
  Settings, 
  Plus,
  ChevronDown,
  Search,
  Menu,
  Edit3,
  Lock
} from 'lucide-react';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';

interface HeaderProps {
  onCreatePost: () => void;
}

export default function Header({ onCreatePost }: HeaderProps) {
  const router = useRouter();
  const { logout, isAuthenticated, user } = useAuth();

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


  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - empty for centering */}
          <div className="flex-1"></div>

          {/* Center - Logo and Search bar */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <Link href="/" className="font-bold text-3xl text-primary">
              Deustagram
            </Link>
            <div className="hidden md:block w-full max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 border border-border/50 rounded-xl bg-background/50 backdrop-blur-sm text-base focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-border transition-all duration-200"
              />
            </div>
          </div>

          {/* Right side - Menu */}
          <div className="flex-1 flex justify-end">
            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
          {isAuthenticated ? (
            <>
              <button 
                onClick={onCreatePost}
                className="flex items-center space-x-3 px-5 py-3 rounded-xl border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/15 backdrop-blur-sm transition-all duration-200 hover:shadow-md group"
              >
                <Edit3 className="w-4 h-4 text-primary transition-colors" />
                <span className="text-sm font-medium text-primary transition-colors">
                  Post
                </span>
              </button>

              {/* Notifications */}
              <NotificationDropdown />

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl border border-border/50 hover:border-border bg-background/50 hover:bg-accent/50 backdrop-blur-sm transition-all duration-200 hover:shadow-sm group"
              >
                <ProfileThumbnail
                  src={user?.avatar}
                  alt="user avatar"
                  size="sm"
                  rounded
                  initials={user?.nickname || user?.first_name || 'U'}
                />
                <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground transition-colors">
                  {user?.nickname || user?.first_name || 'User'}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border/50 bg-popover/95 backdrop-blur-md shadow-xl p-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent/50 transition-all duration-200 group"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                      <span className="font-medium">Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent/50 transition-all duration-200 group"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                      <span className="font-medium">Settings</span>
                    </Link>
                    <div className="h-px bg-border/50 my-1"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group text-left"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <ButtonAccept 
              variant="PrimaryRest" 
              size="size2" 
              className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => router.push('/login')}
            >
              <Lock className="w-4 h-4" />
              Sign In
            </ButtonAccept>
          )}
            </div>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 hover:border-border bg-background/50 hover:bg-accent/50 backdrop-blur-sm transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 px-4 py-4 space-y-3 bg-background/50 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 border border-border/50 rounded-xl bg-background/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-border transition-all duration-200"
            />
          </div>

          {isAuthenticated ? (
            <div className="space-y-2">
              <button 
                onClick={() => {
                  onCreatePost();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-3 w-full px-5 py-3 rounded-xl border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/15 backdrop-blur-sm transition-all duration-200 hover:shadow-md group"
              >
                <Edit3 className="w-4 h-4 text-primary transition-colors" />
                <span className="text-sm font-medium text-primary transition-colors">
                  Create Post
                </span>
              </button>
              
              {/* Mobile Notifications */}
              <div className="flex justify-center">
                <NotificationDropdown />
              </div>
              
              <Link
                href="/profile"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm hover:bg-accent/50 transition-all duration-200 text-center border border-border/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm hover:bg-destructive/10 hover:text-destructive transition-all duration-200 border border-border/50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <ButtonAccept 
              variant="PrimaryRest" 
              size="size3" 
              className="w-full gap-2 shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/login');
              }}
            >
              <Lock className="w-4 h-4" />
              Sign In
            </ButtonAccept>
          )}
        </div>
      )}
    </header>
  );
}
