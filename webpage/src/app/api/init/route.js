import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../lib/db';
import { prisma } from '../../../lib/db';
import { cookies } from 'next/headers';

// Add DEBUG=true for testing purposes
const DEBUG = true;

/**
 * API route for initializing the database
 * This is automatically called when the application starts
 */
export async function GET() {
  try {
    // DEBUG: Show current cookie values if in debug mode
    if (DEBUG) {
      const cookieStore = cookies();
      const allCookies = cookieStore.getAll();
      console.log(`Current cookies (${allCookies.length}):`, allCookies);
    }
    
    // Initialize the database with default data
    const success = await initializeDatabase();
    
    // Debug info
    let debugInfo = {};
    if (DEBUG) {
      try {
        // Count sessions to check if any exist
        const sessionCount = await prisma.session.count();
        const userCount = await prisma.user.count();
        
        debugInfo = {
          sessionCount,
          userCount,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        console.error('Error getting debug info:', e);
        debugInfo = { error: e.message };
      }
    }
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully',
        ...(DEBUG ? { debug: debugInfo } : {})
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Database initialization failed',
        ...(DEBUG ? { debug: debugInfo } : {})
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in database initialization route:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Database initialization error',
      error: error.message
    }, { status: 500 });
  }
}