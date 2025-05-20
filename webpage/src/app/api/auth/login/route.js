import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, createSession, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user);

    // Set auth cookie directly in response
    const cookieName = process.env.COOKIE_NAME || 'robo_auth';
    
    // Create cookie options
    const cookieOptions = {
      secure: false, // Set to false for development
      httpOnly: true,
      maxAge: 12 * 60 * 60, // 12 hours in seconds
      path: '/',
      sameSite: 'lax',
      domain: '', // Empty string uses the current domain
    };
    
    // Create a new response with the cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      },
    });
    
    // Set the cookie on the response
    response.cookies.set(cookieName, session.token, cookieOptions);
    
    // Debug information
    console.log(`Set cookie: ${cookieName}=${session.token.substring(0, 10)}...`);
    console.log('Cookie options:', cookieOptions);
    
    // Get request info for debugging
    const requestHeaders = headers();
    const host = requestHeaders.get('host') || 'unknown';
    const origin = requestHeaders.get('origin') || 'unknown';
    
    // Set up cookie with domain based on host
    // For localhost, don't set domain to allow cookie to work
    let cookieDomain = '';
    if (host !== 'localhost:3000' && host !== '127.0.0.1:3000') {
      // Extract domain from host for real domains
      cookieDomain = host.split(':')[0];
    }
    
    // Attempt to set document.cookie directly (for client-side access)
    const responseHeaders = new Headers(response.headers);
    responseHeaders.append(
      'Set-Cookie', 
      `${cookieName}=${session.token}; Path=/; SameSite=Lax; ${cookieDomain ? `Domain=${cookieDomain};` : ''} Max-Age=${12 * 60 * 60};`
    );
    
    // Create a new response with the same data but updated headers
    const updatedResponse = new NextResponse(
      JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        },
        debug: {
          host,
          origin,
          cookieDomain: cookieDomain || 'not set (using default)',
        }
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
    
    return updatedResponse;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}