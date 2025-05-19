import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
];

// Paths that require admin access
const adminPaths = [
  '/admin',
  '/api/admin',
];

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Check if the path is public
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }
  
  // Get the authentication token from the cookies
  const cookieName = process.env.COOKIE_NAME || 'robo_auth';
  const token = request.cookies.get(cookieName)?.value;
  
  // If no token is present, redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
  
  // Verify the token
  const payload = verifyToken(token);
  
  // If token is invalid, redirect to login
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
  
  // Check if the path requires admin access
  if (adminPaths.some(p => path.startsWith(p)) && !payload.isAdmin) {
    // If the user is not an admin, redirect to home
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/auth/register, /api/auth/login (authentication endpoints)
     * 2. /_next (Next.js internals)
     * 3. /public/static (public files)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /robots.txt (common static files)
     */
    '/((?!_next|public/static|_vercel|favicon.ico|robots.txt).*)',
  ],
};