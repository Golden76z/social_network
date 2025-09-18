'use client';

import { Home, MessageCircle, Heart, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

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

  // Navigation items for authenticated users
  const authenticatedItems: NavigationItem[] = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'Groups', href: '/groups' },
    { icon: MessageCircle, label: 'Messages', href: '/messages' },
    { icon: Heart, label: 'Notifications', href: '/notifications' },
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
          ? 'flex justify-around items-center h-14'
          : 'space-y-2 fixed'
      }
    >
      {navigationItems.map(({ icon: Icon, label, href }) => {
        const isActive = pathname === href;
        const baseStyle = isActive
          ? 'text-blue-600 font-medium'
          : 'text-gray-600 hover:text-blue-500';

        return (
          <Link
            key={label}
            href={href}
            className={
              variant === 'bottom'
                ? `${baseStyle} flex flex-col items-center justify-center text-xs`
                : `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${baseStyle}`
            }
          >
            <Icon className="w-5 h-5" />
            {variant !== 'bottom' && <span className="text-sm">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
};
