'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { animateModalClose } from '@/lib/utils/modalCloseAnimation';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-amber-50/50 dark:bg-amber-900/20',
          iconColor: 'text-amber-600 dark:text-amber-400',
          confirmBg: 'bg-amber-500 hover:bg-amber-600',
          confirmText: 'text-white',
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-50/50 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
          confirmText: 'text-white',
        };
      default: // danger
        return {
          icon: '⚠️',
          iconBg: 'bg-red-50/50 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmBg: 'bg-red-500 hover:bg-red-600',
          confirmText: 'text-white',
        };
    }
  };

  const styles = getVariantStyles();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      animateModalClose(onClose, backdropRef, contentRef);
    }
  };

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      animateModalClose(onClose, backdropRef, contentRef);
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div 
        ref={contentRef}
        className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              <span className="text-xl">{styles.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-muted-foreground leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className={`flex gap-3 ${cancelText ? '' : 'justify-end'}`}>
          {cancelText && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-border/50 rounded-lg hover:bg-accent/50 transition-colors text-foreground disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${cancelText ? 'flex-1' : 'px-6'} py-2 ${styles.confirmBg} ${styles.confirmText} rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
