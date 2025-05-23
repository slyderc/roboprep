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
  // '/home' path removed - no longer bypassing auth
  // '/main' stays protected now, requiring authentication
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
  
  // Don't verify token in middleware - Edge runtime cannot use crypto
  // Just check token existence - actual verification will happen in the API route
  
  // Assume token is valid if it exists
  // We'll let the API routes perform full verification
  console.log(`Token exists for path: ${path}, allowing access`);
  
  // For admin paths, we need to check if user is admin
  // Extract basic info from token without full verification
  let isAdmin = false;
  try {
    // Basic token parsing (not verification)
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      isAdmin = payload.isAdmin || false;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }
  
  // Check if the path requires admin access
  if (adminPaths.some(p => path.startsWith(p)) && !isAdmin) {
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