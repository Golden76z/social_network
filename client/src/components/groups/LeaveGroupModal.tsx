'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Users, AlertTriangle } from 'lucide-react';
import { animateModalClose } from '@/lib/utils/modalCloseAnimation';

interface LeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupTitle: string;
  isLoading?: boolean;
}

export function LeaveGroupModal({
  isOpen,
  onClose,
  onConfirm,
  groupTitle,
  isLoading = false,
}: LeaveGroupModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    animateModalClose(onClose, backdropRef, contentRef);
  }, [onClose]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={contentRef}
        className="w-full max-w-md rounded-xl shadow-xl overflow-hidden bg-card border border-border/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-red-50/50 to-red-100/30 dark:from-red-900/20 dark:to-red-800/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100/50 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Leave Group
              </h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to leave?
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {groupTitle}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You will no longer receive updates from this group and will need to request to join again if you want to rejoin.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-all duration-200 text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--destructive-light)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--destructive-light)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--destructive-light)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Leave Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
