// import Header from '@/components/header';

import Header from '@/components/header';
import { SideBarLeft } from '@/components/SideBarLeft';
import { SideBarRight } from '@/components/SideBarRight';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
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

          <main className="container mx-auto px-4 py-6">{children}</main>
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
    </div>
  );
}
