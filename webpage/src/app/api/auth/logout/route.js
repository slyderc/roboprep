import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const cookieName = process.env.COOKIE_NAME || 'robo_auth';
    const token = cookieStore.get(cookieName)?.value;

    // Delete session from database if token exists
    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    // Clear auth cookie
    clearAuthCookie();

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}