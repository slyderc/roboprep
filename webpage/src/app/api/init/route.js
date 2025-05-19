import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../lib/db';

/**
 * API route for initializing the database
 * This is automatically called when the application starts
 */
export async function GET() {
  try {
    // Initialize the database with default data
    const success = await initializeDatabase();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Database initialization failed'
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