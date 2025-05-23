/**
 * Prisma client instance for database operations
 * This module ensures there's a single instance of the PrismaClient
 */
import { PrismaClient } from '@prisma/client';
import defaultPrompts from '../data/prompts.json';
import { hashPassword, migrateLegacyData } from './auth';
import fs from 'fs';
import path from 'path';

// Avoid multiple instances of Prisma Client in development
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Initializes the database with version tracking
 * Creates required tables if they don't exist and populates with default data
 */
export async function initializeDatabase() {
  try {
    // Check if the tables exist by checking for DatabaseInfo table
    let tablesExist = false;
    try {
      // This will throw an error if the table doesn't exist
      await prisma.$queryRaw`SELECT 1 FROM DatabaseInfo LIMIT 1`;
      tablesExist = true;
    } catch (e) {
      // Tables don't exist yet
      // Tables don't exist, we'll handle this below
    }
    
    // If tables don't exist, we can't continue until migrations are run
    if (!tablesExist) {
      // Migration needed
      return false;
    }
    
    // Check if the DatabaseInfo record exists
    const dbInfo = await prisma.databaseInfo.findUnique({
      where: { id: 1 },
    });

    // If not initialized, create it with the initial version and populate default data
    if (!dbInfo) {
      // Database needs initialization
      
      // Create database info record
      await prisma.databaseInfo.create({
        data: {
          id: 1,
          version: process.env.DATABASE_INIT_VERSION || '2.0.0',
        },
      });
      
      // Create default categories
      await createDefaultCategories();
      
      // Create default prompts
      await createDefaultPrompts();
      
      // Create default settings
      await createDefaultSettings();
      
      // Create default admin user
      const adminUserId = await createDefaultAdminUser();
      
      // Migrate legacy data to the admin user if we created one
      if (adminUserId) {
        await migrateLegacyData(adminUserId);
      }
      
      // Database initialized
    } else {
      // Check if we need to upgrade the database version
      const currentVersion = dbInfo.version;
      if (currentVersion === '1.0.0') {
        // Upgrade from 1.0.0 to 2.0.0 - add multi-user support
        
        // Create default admin user if no users exist
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          const adminUserId = await createDefaultAdminUser();
          
          // Migrate legacy data to the admin user if we created one
          if (adminUserId) {
            await migrateLegacyData(adminUserId);
          }
        }
        
        // Update database version
        await updateDatabaseVersion('2.0.0');
      }
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Create default admin user
 * @returns {Promise<string|null>} - The ID of the created admin user, or null if creation failed
 */
async function createDefaultAdminUser() {
  try {
    // Create admin user
    const hashedPassword = await hashPassword('RoboPrepMe');
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
      },
    });
    
    // Also create a test user
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      },
    });
    
    return adminUser.id;
  } catch (error) {
    console.error('Error creating default admin user:', error);
    return null;
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

/**
 * Create default categories in the database
 */
async function createDefaultCategories() {
  const defaultCategories = [
    { id: 'artist-bio', name: 'Artist Bio', isUserCreated: false },
    { id: 'song-story', name: 'Song Story', isUserCreated: false },
    { id: 'show-segments', name: 'Show Segments', isUserCreated: false },
    { id: 'music-trivia', name: 'Music Trivia', isUserCreated: false },
    { id: 'interviews', name: 'Interviews', isUserCreated: false },
    { id: 'weather', name: 'Weather', isUserCreated: false },
    { id: 'features', name: 'Features', isUserCreated: false },
    { id: 'social-media', name: 'Social Media', isUserCreated: false },
  ];

  
  for (const category of defaultCategories) {
    await prisma.category.create({
      data: category
    });
  }
}

/**
 * Create default prompts in the database
 */
async function createDefaultPrompts() {
  
  for (const prompt of defaultPrompts) {
    // Extract tags
    const tags = prompt.tags || [];
    
    // Create the prompt
    await prisma.prompt.create({
      data: {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description || '',
        categoryId: prompt.category || null,
        promptText: prompt.promptText,
        isUserCreated: false,
        usageCount: prompt.usageCount || 0,
        createdAt: new Date(prompt.createdAt || new Date()),
        lastUsed: prompt.lastUsed ? new Date(prompt.lastUsed) : null,
        lastEdited: prompt.lastEdited ? new Date(prompt.lastEdited) : null,
      }
    });
    
    // Create tags and associate with prompt
    for (const tagName of tags) {
      // Find or create tag
      let tag = await prisma.tag.findFirst({
        where: { name: tagName }
      });
      
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: tagName }
        });
      }
      
      // Create prompt-tag relationship
      await prisma.promptTag.create({
        data: {
          promptId: prompt.id,
          tagId: tag.id
        }
      });
    }
  }
}

/**
 * Create default settings in the database
 */
async function createDefaultSettings() {
  const defaultSettings = [
    { key: 'fontSize', value: JSON.stringify('medium') },
    { key: 'theme', value: JSON.stringify('light') }
  ];

  
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }
}

/**
 * Gets database statistics including counts of records in various tables
 * @returns {Promise<Object>} Object containing counts of records in each table
 */
export async function getDbStats() {
  try {
    const [
      promptCount,
      userPromptCount,
      corePromptCount,
      categoryCount,
      tagCount,
      responseCount,
      userFavoriteCount,
      userRecentlyUsedCount,
      userCount,
      settingCount,
      userSettingCount
    ] = await Promise.all([
      prisma.prompt.count(),
      prisma.prompt.count({ where: { isUserCreated: true } }),
      prisma.prompt.count({ where: { isUserCreated: false } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.response.count(),
      prisma.userFavorite.count(),
      prisma.userRecentlyUsed.count(),
      prisma.user.count(),
      prisma.setting.count(),
      prisma.userSetting.count()
    ]);

    return {
      promptCount,
      userPromptCount,
      corePromptCount,
      categoryCount,
      tagCount,
      responseCount,
      userFavoriteCount,
      userRecentlyUsedCount,
      userCount,
      settingCount,
      userSettingCount
    };
  } catch (error) {
    console.error('Error getting DB stats:', error);
    return {
      error: error.message,
      promptCount: 0,
      userPromptCount: 0,
      corePromptCount: 0,
      categoryCount: 0,
      tagCount: 0,
      responseCount: 0,
      userFavoriteCount: 0,
      userRecentlyUsedCount: 0,
      userCount: 0,
      settingCount: 0,
      userSettingCount: 0
    };
  }
}

export default prisma;