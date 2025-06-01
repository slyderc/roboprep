import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, createSession, generateToken } from '@/lib/auth';
import { verifyTurnstileToken, getClientIP } from '@/lib/turnstile';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, turnstileToken } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify Turnstile token (skip for API requests, development, or if not configured)
    const isApiRequest = request.headers.get('user-agent')?.includes('API') || 
                        request.headers.get('x-api-key');
    
    // Better environment detection
    const isDevelopment = process.env.NODE_ENV === 'development';
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    
    // Only bypass Turnstile for actual development environments
    const isLocalDevelopment = isDevelopment && (
      host.includes('localhost') || 
      host.includes('127.0.0.1') || 
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    );
    
    // Enable Turnstile for production (when TURNSTILE_SECRET_KEY exists and not local dev)
    const shouldUseTurnstile = process.env.TURNSTILE_SECRET_KEY && !isLocalDevelopment && !isApiRequest;
    
    if (shouldUseTurnstile) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'Security verification required' },
          { status: 400 }
        );
      }

      const clientIP = getClientIP(request);
      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIP);
      
      if (!turnstileResult.success) {
        console.warn('Turnstile verification failed for login attempt:', turnstileResult.error);
        return NextResponse.json(
          { error: 'Security verification failed. Please try again.' },
          { status: 400 }
        );
      }
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

    // Check if user is approved
    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'Your account is pending administrator approval. Please check back later.' },
        { status: 403 }
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
    
    
    // Get request info for debugging
    const requestHeaders = headers();
    const requestHost = requestHeaders.get('host') || 'unknown';
    const requestOrigin = requestHeaders.get('origin') || 'unknown';
    
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
        isApproved: user.isApproved,
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
    
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}