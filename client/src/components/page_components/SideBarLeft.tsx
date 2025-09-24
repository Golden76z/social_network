'use client';

import { Home, MessageCircle, Heart, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';

type Variant = 'sidebar' | 'bottom';

interface NavigationItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface SideBarLeftProps {
  variant?: Variant;
}

export const SideBarLeft: React.FC<SideBarLeftProps> = ({
  variant = 'sidebar',
}) => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  // Custom notification icon component
  const NotificationIcon = () => (
    <Heart className={`w-5 h-5 ${unreadCount > 0 ? 'fill-current' : ''}`} />
  );

  // Navigation items for authenticated users
  const authenticatedItems: NavigationItem[] = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'Groups', href: '/groups' },
    { icon: MessageCircle, label: 'Messages', href: '/messages' },
    { icon: NotificationIcon, label: 'Notifications', href: '/notifications' },
  ];

  // Navigation items for non-authenticated users (only Home)
  const publicItems: NavigationItem[] = [
    { icon: Home, label: 'Home', href: '/' },
  ];

  const navigationItems = isAuthenticated ? authenticatedItems : publicItems;

  return (
    <nav
      className={
        variant === 'bottom'
          ? 'flex justify-around items-center h-16 bg-sidebar border-t border-sidebar-border'
          : 'space-y-2 fixed w-full max-w-xs'
      }
    >
      {navigationItems.map(({ icon: Icon, label, href }) => {
        // Robust active state detection - handle trailing slashes
        const isActive = pathname === href || 
                        pathname === href + '/' ||
                        (href === '/' && (pathname === '/' || pathname === '/home' || pathname === '/home/')) ||
                        (href !== '/' && (pathname.startsWith(href) || pathname.startsWith(href + '/')));
        
        if (variant === 'bottom') {
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center justify-center text-sm transition-colors duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <div className={`relative p-2 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-accent border-2 border-primary' 
                  : 'hover:bg-primary/10 border border-transparent hover:border-primary/20'
              }`}>
                <Icon className="w-5 h-5" />
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--purple-400)] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </Link>
          );
        }

        // Sidebar variant with simple, contained styling
        return (
          <Link
            key={label}
            href={href}
            className={`group flex items-center space-x-3 mx-4 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              isActive
                ? 'bg-accent text-primary border-2 border-primary'
                : 'text-muted-foreground hover:text-primary hover:bg-accent'
            }`}
          >
            <div className={`relative p-2 rounded-md transition-colors duration-200 ${
              isActive 
                ? 'bg-primary/20' 
                : 'bg-muted/30 group-hover:bg-primary/15'
            }`}>
              <Icon className="w-5 h-5" />
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--purple-400)] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            
            <span className={`text-base font-medium transition-colors duration-200 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
