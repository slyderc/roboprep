/**
 * Prisma client instance for database operations
 * This module ensures there's a single instance of the PrismaClient
 */
import { PrismaClient } from '@prisma/client';

// Avoid multiple instances of Prisma Client in development
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Initializes the database with version tracking
 * Creates required tables if they don't exist
 */
export async function initializeDatabase() {
  try {
    // Check if the DatabaseInfo record exists
    const dbInfo = await prisma.databaseInfo.findUnique({
      where: { id: 1 },
    });

    // If not, create it with the initial version
    if (!dbInfo) {
      await prisma.databaseInfo.create({
        data: {
          id: 1,
          version: process.env.DATABASE_INIT_VERSION || '1.0.0',
        },
      });
      console.log(`Database initialized with version ${process.env.DATABASE_INIT_VERSION || '1.0.0'}`);
    } else {
      console.log(`Database already initialized, version: ${dbInfo.version}`);
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Get current database version
 * @returns {Promise<string>} The current database version
 */
export async function getDatabaseVersion() {
  try {
    const dbInfo = await prisma.databaseInfo.findUnique({
      where: { id: 1 },
    });
    return dbInfo?.version || null;
  } catch (error) {
    console.error('Error fetching database version:', error);
    return null;
  }
}

/**
 * Update database version
 * @param {string} version - The new version to set
 * @returns {Promise<boolean>} Success flag
 */
export async function updateDatabaseVersion(version) {
  try {
    await prisma.databaseInfo.update({
      where: { id: 1 },
      data: { version },
    });
    return true;
  } catch (error) {
    console.error('Error updating database version:', error);
    return false;
  }
}

export default prisma;