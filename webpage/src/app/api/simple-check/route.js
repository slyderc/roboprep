import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

// Simple endpoint that doesn't use any imports that might cause issues
export async function GET() {
  try {
    // Show all cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Get headers for debugging
    const headersList = headers();
    const host = headersList.get('host') || 'unknown';
    const origin = headersList.get('origin') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    
    // Simple response with cookies and no DB access
    return NextResponse.json({
      message: 'Simple check endpoint',
      cookies: allCookies.map(c => ({
        name: c.name,
        value: c.value.substring(0, 10) + '...',
      })),
      request: {
        host,
        origin,
        userAgent: userAgent.substring(0, 30) + '...',
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_FIRST_10: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'not-set',
        COOKIE_NAME: process.env.COOKIE_NAME || 'robo_auth',
      }
    });
  } catch (error) {
    console.error('Simple check error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}