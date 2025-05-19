import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-change-this-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '12h';
const COOKIE_NAME = process.env.COOKIE_NAME || 'robo_auth';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Create a session for a user
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Session object
 */
export async function createSession(user) {
  const token = generateToken(user);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12); // 12 hour session

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return session;
}

/**
 * Set an authentication cookie
 * @param {Object} session - Session object
 */
export function setAuthCookie(session) {
  const cookieOptions = {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    expires: session.expiresAt,
    path: '/',
    sameSite: 'strict',
  };

  cookies().set(COOKIE_NAME, session.token, cookieOptions);
}

/**
 * Clear the authentication cookie
 */
export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

/**
 * Get the current user from the request cookies
 * @returns {Promise<Object|null>} - User object or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      return null;
    }
    
    // Check if session exists and is valid
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
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Middleware to check if a user is authenticated
 * @returns {Promise<Object|null>} - User object or null if not authenticated
 */
export async function isAuthenticated() {
  return await getCurrentUser();
}

/**
 * Middleware to check if a user is an admin
 * @returns {Promise<boolean>} - True if user is an admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user ? user.isAdmin : false;
}

/**
 * Initialize the default admin user
 */
export async function initializeDefaultAdmin() {
  try {
    // Check if we have an admin user
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    // If no admin user exists, create one
    if (!adminUser) {
      const hashedPassword = await hashPassword('RoboPrepMe');
      
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          isAdmin: true,
          firstName: 'Admin',
          lastName: 'User',
        },
      });
      
      console.log('Created default admin user');
    }
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
}

/**
 * Migrate legacy user data to the new user model
 * @param {string} userId - User ID to migrate data to
 */
export async function migrateLegacyData(userId) {
  try {
    // Migrate favorites
    const favorites = await prisma.favorite.findMany();
    
    for (const favorite of favorites) {
      await prisma.userFavorite.upsert({
        where: {
          userId_promptId: {
            userId,
            promptId: favorite.promptId,
          },
        },
        create: {
          userId,
          promptId: favorite.promptId,
        },
        update: {},
      });
    }
    
    // Migrate recently used
    const recentlyUsed = await prisma.recentlyUsed.findMany();
    
    for (const recent of recentlyUsed) {
      await prisma.userRecentlyUsed.upsert({
        where: {
          userId_promptId: {
            userId,
            promptId: recent.promptId,
          },
        },
        create: {
          userId,
          promptId: recent.promptId,
          usedAt: recent.usedAt,
        },
        update: {
          usedAt: recent.usedAt,
        },
      });
    }
    
    // Migrate settings
    const settings = await prisma.setting.findMany();
    
    for (const setting of settings) {
      await prisma.userSetting.upsert({
        where: {
          userId_key: {
            userId,
            key: setting.key,
          },
        },
        create: {
          userId,
          key: setting.key,
          value: setting.value,
        },
        update: {
          value: setting.value,
        },
      });
    }
    
    console.log(`Legacy data migrated to user ${userId}`);
  } catch (error) {
    console.error('Error migrating legacy data:', error);
  }
}