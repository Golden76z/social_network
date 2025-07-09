'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo + Search */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-xl">
            Destagram
          </Link>

          {/* Search - hidden on small screens */}
          <div className="hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1.5 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-3" ref={dropdownRef}>
          {isAuthenticated ? (
            <>
              <Link
                href="/posts/create"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                ✏️ Post
              </Link>

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
              >
                👤
              </button>

              {dropdownOpen && (
                <div className="absolute right-4 top-16 mt-1 w-40 rounded-md border border-border bg-popover shadow-md p-1 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              🔐 Sign In
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-md border border-border"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-2">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {isAuthenticated ? (
            <>
              <Link
                href="/posts/create"
                className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors text-center"
              >
                ✏️ Post
              </Link>
              <Link
                href="/profile"
                className="block w-full px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors text-center"
              >
                👤 Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="block w-full text-center px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/login");
              }}
              className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors text-center"
            >
              🔐 Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}
