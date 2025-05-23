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
    
    console.log(`Login attempt for email: ${email}`);

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
    
    // Debug information for cookies
    console.log(`Creating cookie for session: ${session.token.substring(0, 10)}...`);
    console.log('Cookie options:', cookieOptions);
    
    // Get request info for debugging
    const requestHeaders = headers();
    const host = requestHeaders.get('host') || 'unknown';
    const origin = requestHeaders.get('origin') || 'unknown';
    
    // For localhost, explicitly ensure no domain is set
    cookieOptions.domain = undefined;
    
    // Create the response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      }
    });
    
    // Set cookie directly on the response
    response.cookies.set({
      name: cookieName,
      value: session.token,
      path: '/',
      secure: cookieOptions.secure,
      httpOnly: cookieOptions.httpOnly,
      maxAge: cookieOptions.maxAge,
      sameSite: 'lax'
    });
    
    console.log(`Set cookie: ${cookieName}=${session.token.substring(0, 10)}... on host: ${host}`);
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}