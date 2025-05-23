import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

// Set to true for additional debugging information
const DEBUG = true;

// Delete a user
export async function DELETE(request, { params }) {
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

    // Prevent deleting yourself
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
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

    // Delete user with all related data
    // Note: All user-related data should be automatically deleted due to 
    // cascade delete constraints in the schema
    try {
      if (DEBUG) {
        // Count user's related data before deletion
        const userFavorites = await prisma.userFavorite.count({ where: { userId } });
        const userRecentlyUsed = await prisma.userRecentlyUsed.count({ where: { userId } });
        const userSettings = await prisma.userSetting.count({ where: { userId } });
        const userSessions = await prisma.session.count({ where: { userId } });
        
        console.log(`User ${userId} has: ${userFavorites} favorites, ${userRecentlyUsed} recently used items, ${userSettings} settings, ${userSessions} sessions`);
      }
      
      // Delete the user directly - cascade deletes will handle related data
      console.log(`Attempting to delete user with ID: ${userId}`);
      const result = await prisma.user.delete({
        where: { id: userId },
      });
      console.log('User deleted successfully:', result.email);
      
      if (DEBUG) {
        // Verify deletion
        const checkUser = await prisma.user.findUnique({ where: { id: userId } });
        console.log(`User deletion check: ${checkUser ? 'User still exists' : 'User deleted'}`);
      }
    } catch (deleteError) {
      console.error('Error during user deletion transaction:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        message: error.message,
        stack: DEBUG ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}