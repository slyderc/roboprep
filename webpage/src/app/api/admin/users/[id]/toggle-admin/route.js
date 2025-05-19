import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

// Toggle a user's admin status
export async function POST(request, { params }) {
  try {
    // Check if user is admin
    const adminUser = await isAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const { isAdmin: newAdminStatus } = await request.json();

    // Validate admin status
    if (typeof newAdminStatus !== 'boolean') {
      return NextResponse.json(
        { error: 'Admin status must be a boolean' },
        { status: 400 }
      );
    }

    // Prevent removing your own admin status
    if (userId === adminUser.id && !newAdminStatus) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin status' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's admin status
    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: newAdminStatus },
    });

    return NextResponse.json({
      message: `User is ${newAdminStatus ? 'now' : 'no longer'} an admin`,
    });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle admin status' },
      { status: 500 }
    );
  }
}