'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center space-x-3 text-base text-gray-500">
          <div className="w-7 h-7 bg-blue-500/80 rounded flex items-center justify-center">
            <span className="text-white/90 font-bold text-sm">D</span>
          </div>
          <span>Deustragram - 2025 all rights reserved ©</span>
        </div>
      </div>
    </footer>
  );
}
