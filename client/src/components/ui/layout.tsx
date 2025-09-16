'use client';

import Header from '../header';
import { SideBarLeft } from '../SideBarLeft';
import { SideBarRight } from '../SideBarRight';

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {' '}
      {/* extra padding bottom for mobile nav */}
      {/* Navbar */}
      <Header />
      {/* Main Content */}
      <div className="flex flex-col md:flex-row max-w-full mx-auto">
        {/* Left Sidebar - desktop only */}
        <div className="hidden md:block w-[20%] min-h-screen bg-white border-r border-gray-200 p-4">
          <SideBarLeft variant="sidebar" />
        </div>

        {children}
        {/* Right Sidebar - hidden on mobile */}
        <div className="hidden md:block w-[20%] min-h-screen bg-white border-l border-gray-200 p-4">
          <SideBarRight />
        </div>
      </div>
      {/* Bottom Navigation - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white shadow-sm">
        <SideBarLeft variant="bottom" />
      </div>
    </div>
  );
};

export default Layout;
