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

// Development routes that require development environment
const devRoutes = ['/dev'];

// Check if we're in development environment
const isDevelopmentEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_ENV === 'development' ||
         process.env.ENV === 'development';
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated by looking for the JWT token cookie
  const isAuthenticated = request.cookies.has('jwt_token');
  
  // Handle dev routes - only allow in development environment
  if (devRoutes.some(route => pathname.startsWith(route))) {
    if (!isDevelopmentEnvironment()) {
      // Redirect to home with error message for non-development environments
      const url = new URL('/home', request.url);
      url.searchParams.set('error', 'dev-access-denied');
      return NextResponse.redirect(url);
    }
    // Allow access to dev routes in development environment
    return NextResponse.next();
  }
  
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
