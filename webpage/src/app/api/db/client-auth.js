import { cookies } from 'next/headers';
import { prisma } from '../../../lib/db';

// Function to check auth on the API side, not using middleware
export async function checkUserAuth() {
  try {
    const cookieStore = cookies();
    const cookieName = process.env.COOKIE_NAME || 'robo_auth';
    const token = cookieStore.get(cookieName)?.value;
    
    if (!token) {
      return { isAuthenticated: false, message: 'No auth token found' };
    }
    
    // Look up the token in the session table
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
    
    if (!session) {
      return { isAuthenticated: false, message: 'Invalid or expired session' };
    }
    
    // Session is valid, user is authenticated
    return { 
      isAuthenticated: true, 
      user: {
        id: session.user.id,
        email: session.user.email,
        isAdmin: session.user.isAdmin,
      }
    };
  } catch (error) {
    console.error('Error checking auth:', error);
    return { isAuthenticated: false, message: 'Auth check error: ' + error.message };
  }
}