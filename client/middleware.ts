import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/home',
  '/notifications', 
  '/posts',
  '/messages',
  '/groups',
  '/settings'
];

// Profile routes that allow unauthenticated access to public profiles
const profileRoutes = ['/profile'];

// Auth routes that should redirect to /home if already authenticated
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated by looking for the JWT token cookie
  const isAuthenticated = request.cookies.has('jwt_token');
  
  // Handle profile routes - allow unauthenticated access to public profiles
  if (profileRoutes.some(route => pathname.startsWith(route))) {
    // Allow access to profile routes for both authenticated and unauthenticated users
    return NextResponse.next();
  }
  
  // Redirect to login if trying to access protected routes without authentication
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect to home if trying to access auth routes while already authenticated
  if (authRoutes.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  
  // Redirect root to appropriate page based on auth status
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    // If not authenticated, show the public landing page (no redirect needed)
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - dev (development pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|dev).*)',
  ],
};
