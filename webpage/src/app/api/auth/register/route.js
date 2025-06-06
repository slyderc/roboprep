import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSession, setAuthCookie, migrateLegacyData } from '@/lib/auth';
import { verifyTurnstileToken, getClientIP } from '@/lib/turnstile';
import { passwordValidation, emailValidation } from '@/lib/validation';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, turnstileToken } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Server-side email validation
    const emailValid = emailValidation.validate(email);
    if (!emailValid.isValid) {
      return NextResponse.json(
        { error: emailValid.errors[0] || 'Invalid email address' },
        { status: 400 }
      );
    }

    // Server-side password validation
    const passwordValid = passwordValidation.validate(password);
    if (!passwordValid.isValid) {
      return NextResponse.json(
        { error: passwordValid.errors[0] || 'Password does not meet security requirements' },
        { status: 400 }
      );
    }

    // Validate name fields if provided
    if (firstName && typeof firstName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid first name' },
        { status: 400 }
      );
    }

    if (lastName && typeof lastName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid last name' },
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
        console.warn('Turnstile verification failed for registration attempt:', turnstileResult.error);
        return NextResponse.json(
          { error: 'Security verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine if this is the first user (make them admin and auto-approve)
    const userCount = await prisma.user.count();
    const isAdmin = userCount === 0;
    const isApproved = isAdmin; // First user is auto-approved, others need approval

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        isAdmin,
        isApproved,
      },
    });

    // If this is the first user, migrate legacy data
    if (isAdmin) {
      await migrateLegacyData(newUser.id);
    }

    // Only create session and set cookie if user is approved
    if (isApproved) {
      // Create session
      const session = await createSession(newUser);

      // Set auth cookie
      setAuthCookie(session);
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(
      {
        message: isApproved 
          ? 'User registered successfully' 
          : 'Account created successfully. Please wait for administrator approval before signing in.',
        user: userWithoutPassword,
        needsApproval: !isApproved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}