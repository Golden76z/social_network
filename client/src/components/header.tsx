"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Icônes depuis react-icons
import { AiFillHome } from "react-icons/ai";
import { MdGroups, MdNotifications } from "react-icons/md";
import { IoChatbubblesSharp } from "react-icons/io5";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    document.cookie =
      "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const navItems = [
    { href: "/home", label: "Home", icon: <AiFillHome size={22} /> },
    { href: "/groups", label: "Groups", icon: <MdGroups size={22} /> },
    {
      href: "/messages",
      label: "Chats",
      icon: <IoChatbubblesSharp size={22} />,
    },
    {
      href: "/notifications",
      label: "Notifs",
      icon: <MdNotifications size={22} />,
    },
  ];

  return (
    <>
      {/* Header Desktop */}
      <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/home" className="font-semibold text-xl">
            Deustagram
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/posts/create"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              ✏️ Post
            </Link>
            <Link
              href="/settings"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              ⚙️
            </Link>
            <Button variant="outline" onClick={handleLogout} size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation (Bottom bar with SVG icons) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-t border-gray-200 shadow-md rounded-t-xl">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
