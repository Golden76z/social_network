'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <div 
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: 'var(--purple-300)' }}
          >
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span>Deustragram - 2025 all rights reserved ©</span>
        </div>
      </div>
    </footer>
  );
}
