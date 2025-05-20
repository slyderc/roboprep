import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/init',
  '/api/simple-check', // Simple endpoint for checking environment
  '/api/db', // Database operations - client-side auth instead of middleware
  '/api/openai', // OpenAI API - client-side auth instead of middleware
  '/favicon.ico',
  '/assets',
  '/home', // Alternative home page that bypasses auth for testing
  '/main', // Alternative main entry point that bypasses middleware auth
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
    console.log(`No token found for path: ${path}, redirecting to login`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    
    // Only add redirect parameter for non-asset paths
    if (!path.startsWith('/assets/')) {
      url.searchParams.set('redirect', path);
    }
    
    return NextResponse.redirect(url);
  }
  
  // Verify the token
  const payload = verifyToken(token);
  
  // If token is invalid, redirect to login
  if (!payload) {
    console.log(`Invalid token for path: ${path}, redirecting to login`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    
    // Only add redirect parameter for non-asset paths
    if (!path.startsWith('/assets/')) {
      url.searchParams.set('redirect', path);
    }
    
    return NextResponse.redirect(url);
  }
  
  console.log(`Valid token for path: ${path}, user ID: ${payload.userId}`);
  
  // Check if the path requires admin access
  if (adminPaths.some(p => path.startsWith(p)) && !payload.isAdmin) {
    // If the user is not an admin, redirect to home
    console.log(`User is not admin, redirecting from admin path: ${path}`);
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