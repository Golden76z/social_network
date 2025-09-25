'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Users, Check } from 'lucide-react';
import { animateModalClose } from '@/lib/utils/modalCloseAnimation';

interface Follower {
  id: number;
  nickname: string;
  fullName: string;
  first_name: string;
  last_name: string;
  avatar?: string;
}

interface FollowerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFollowers: number[]) => void;
  initialSelection?: number[];
  followers: Follower[];
}

export function FollowerSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
  followers,
}: FollowerSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFollowers, setSelectedFollowers] = useState<number[]>(initialSelection);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Update selection when initialSelection changes
  useEffect(() => {
    setSelectedFollowers(initialSelection);
  }, [initialSelection]);

  // Filter followers based on search term
  const filteredFollowers = followers.filter((follower) =>
    follower.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    follower.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFollower = (followerId: number) => {
    setSelectedFollowers(prev => 
      prev.includes(followerId) 
        ? prev.filter(id => id !== followerId)
        : [...prev, followerId]
    );
  };

  const selectAll = () => {
    setSelectedFollowers(filteredFollowers.map(f => f.id));
  };

  const selectNone = () => {
    setSelectedFollowers([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedFollowers);
    onClose();
  };

  const handleClose = () => {
    animateModalClose(() => {
      setSearchTerm('');
      onClose();
    }, backdropRef, contentRef);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={contentRef}
        className="w-full max-w-2xl max-h-[80vh] rounded-lg shadow-lg overflow-hidden bg-card border border-border animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Select Followers
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose who can see your private post
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-6 border-b border-border">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search followers..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-background text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={selectNone}
                className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                Select None
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {selectedFollowers.length} of {followers.length} selected
            </span>
          </div>
        </div>

        {/* Followers List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredFollowers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No followers found</p>
              {searchTerm && (
                <p className="text-sm mt-2">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredFollowers.map((follower) => (
                <div
                  key={follower.id}
                  onClick={() => toggleFollower(follower.id)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <img
                      src={follower.avatar || '/default-avatar.png'}
                      alt={follower.nickname}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png';
                      }}
                    />
                    {selectedFollowers.includes(follower.id) && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {follower.nickname}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {follower.fullName}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded border-2 transition-colors ${
                        selectedFollowers.includes(follower.id)
                          ? 'bg-primary border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {selectedFollowers.includes(follower.id) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {selectedFollowers.length > 0 ? (
              <span>
                {selectedFollowers.length} follower{selectedFollowers.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>No followers selected</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg transition-colors text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
