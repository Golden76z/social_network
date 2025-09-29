'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, User, Hash, FileText, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';
import { ProfileThumbnail } from '@/components/layout/ProfileThumbnail';

export type SearchFilter = 'all' | 'users' | 'groups' | 'posts';

interface SearchResult {
  id: number;
  type: 'user' | 'group' | 'post';
  title: string;
  subtitle?: string;
  avatar?: string;
  isPrivate?: boolean;
  isFollowing?: boolean;
  isMember?: boolean;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onPostClick?: (postId: number) => void;
}

export function SearchBar({ className, placeholder = "Search...", onPostClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const performSearch = async () => {
      if (query.length < 2 || !isAuthenticated) return;

      setIsLoading(true);
      setIsOpen(true);

      try {
        // Define proper types for search results
        interface SearchUser {
          id: number;
          nickname: string;
          first_name: string;
          last_name: string;
          avatar: string;
          is_private: boolean;
          isFollowing?: boolean;
        }

        interface SearchGroup {
          id: number;
          title: string;
          bio: string;
          avatar: string;
          isMember?: boolean;
        }

        interface SearchPost {
          id: number;
          title: string;
          body: string;
          author_avatar: string;
        }

        const searchPromises: Promise<SearchResult[]>[] = [];

        if (filter === 'all' || filter === 'users') {
          const userSearch: Promise<SearchResult[]> = apiClient.get<SearchUser[]>(`/api/search/users?q=${encodeURIComponent(query)}&limit=5`)
            .then((data: SearchUser[]) => {
              if (!data || !Array.isArray(data)) {
                return [];
              }
              return data.map((user: SearchUser) => ({
                id: user.id,
                type: 'user' as const,
                title: user.nickname || (user.is_private ? 'Private User' : `${user.first_name} ${user.last_name}`),
                subtitle: user.is_private ? undefined : (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : undefined),
                avatar: user.avatar,
                isPrivate: user.is_private,
                isFollowing: user.isFollowing
              }));
            })
            .catch((error) => {
              console.error('User search error:', error);
              return [];
            });
          searchPromises.push(userSearch);
        }

        if (filter === 'all' || filter === 'groups') {
          const groupSearch: Promise<SearchResult[]> = apiClient.get<SearchGroup[]>(`/api/search/groups?q=${encodeURIComponent(query)}&limit=5`)
            .then((data: SearchGroup[]) => {
              if (!data || !Array.isArray(data)) {
                return [];
              }
              return data.map((group: SearchGroup) => ({
                id: group.id,
                type: 'group' as const,
                title: group.title,
                subtitle: group.bio,
                avatar: group.avatar,
                isMember: group.isMember
              }));
            })
            .catch((error: unknown) => {
              console.error('Group search error:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                fullError: error
              });
              return [];
            });
          searchPromises.push(groupSearch);
        }

        if (filter === 'all' || filter === 'posts') {
          const postSearch: Promise<SearchResult[]> = apiClient.get<SearchPost[]>(`/api/search/posts?q=${encodeURIComponent(query)}&limit=5`)
            .then((data: SearchPost[]) => {
              if (!data || !Array.isArray(data)) {
                return [];
              }
              return data.map((post: SearchPost) => ({
                id: post.id,
                type: 'post' as const,
                title: post.title,
                subtitle: post.body?.substring(0, 100) + (post.body?.length > 100 ? '...' : ''),
                avatar: post.author_avatar
              }));
            })
            .catch((error) => {
              console.error('Post search error:', error);
              return [];
            });
          searchPromises.push(postSearch);
        }

        const searchResults = await Promise.all(searchPromises);
        const allResults = searchResults.flat();
        
        // Sort results by type: users first, then groups, then posts
        allResults.sort((a, b) => {
          const typeOrder = { user: 0, group: 1, post: 2 };
          const aOrder = typeOrder[a.type];
          const bOrder = typeOrder[b.type];
          return aOrder - bOrder;
        });
        
        setResults(allResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filter, isAuthenticated]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);

    switch (result.type) {
      case 'user':
        if (isAuthenticated) {
          router.push(`/profile?userId=${result.id}`);
        } else {
          router.push('/login');
        }
        break;
      case 'group':
        if (isAuthenticated) {
          router.push(`/groups/${result.id}/info`);
        } else {
          router.push('/login');
        }
        break;
      case 'post':
        if (onPostClick) {
          onPostClick(result.id);
        } else {
          // Default behavior - could navigate to post page or open modal
          router.push(`/posts/${result.id}`);
        }
        break;
    }
  };

  const getFilterIcon = (filterType: SearchFilter) => {
    switch (filterType) {
      case 'users':
        return <Users className="w-4 h-4" />;
      case 'groups':
        return <Hash className="w-4 h-4" />;
      case 'posts':
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4 text-muted-foreground" />;
      case 'group':
        return <Hash className="w-4 h-4 text-muted-foreground" />;
      case 'post':
        return (
          <div className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center">
            <span className="text-xs font-medium text-purple-700">P</span>
          </div>
        );
      default:
        return <Search className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'user':
        return (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium m-1">
            User
          </span>
        );
      case 'group':
        return (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md font-medium m-1">
            Group
          </span>
        );
      case 'post':
        return (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-md font-medium m-1">
            Post
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2.5 border border-border/50 rounded-xl bg-background/50 backdrop-blur-sm text-base focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-border hover:border-purple-300 transition-all duration-200"
        />
        
        {/* Filter Icons on the right */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {(['all', 'users', 'groups', 'posts'] as SearchFilter[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                filter === filterType
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title={`Search ${filterType}`}
            >
              {getFilterIcon(filterType)}
            </button>
          ))}
          
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                setSelectedIndex(-1);
              }}
              className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isOpen && query.length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {!isAuthenticated ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="mb-2">Please sign in to search</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-3 py-1 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-1">
              {results.map((result, index) => {
                const prevResult = index > 0 ? results[index - 1] : null;
                const showSeparator = prevResult && prevResult.type !== result.type;
                
                return (
                  <div key={`${result.type}-${result.id}`}>
                    {showSeparator && (
                      <div className="mx-3 my-2 h-px bg-[var(--separator-purple)] opacity-60"></div>
                    )}
                    <button
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors rounded-lg",
                        selectedIndex === index && "bg-accent"
                      )}
                    >
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0">
                    {result.type === 'user' && result.avatar ? (
                      <ProfileThumbnail
                        src={result.avatar}
                        size="sm"
                        initials={result.title[0]}
                        className="w-6 h-6"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        {getResultIcon(result.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-medium text-sm truncate">
                        {result.title}
                      </span>
                      {result.isPrivate && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground m-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Private
                        </span>
                      )}
                      {result.isFollowing && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md m-1">
                          Following
                        </span>
                      )}
                      {result.isMember && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md m-1">
                          Member
                        </span>
                      )}
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Type badge */}
                  <div className="flex-shrink-0">
                    {getTypeBadge(result.type)}
                  </div>
                </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
