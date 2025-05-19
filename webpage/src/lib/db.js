/**
 * Prisma client instance for database operations
 * This module ensures there's a single instance of the PrismaClient
 */
import { PrismaClient } from '@prisma/client';
import defaultPrompts from '../data/prompts.json';
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
          version: process.env.DATABASE_INIT_VERSION || '1.0.0',
        },
      });
      
      // Create default categories
      await createDefaultCategories();
      
      // Create default prompts
      await createDefaultPrompts();
      
      // Create default settings
      await createDefaultSettings();
      
      // Database initialized
    } else {
      // Database already initialized
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

  console.log(`Creating ${defaultCategories.length} default categories`);
  
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
  console.log(`Creating ${defaultPrompts.length} default prompts`);
  
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

  console.log(`Creating ${defaultSettings.length} default settings`);
  
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }
}

export default prisma;