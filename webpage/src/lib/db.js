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
      const targetVersion = process.env.DATABASE_TARGET_VERSION || '2.1.0';
      
      if (currentVersion !== targetVersion) {
        console.log(`Database upgrade needed: ${currentVersion} → ${targetVersion}`);
        const success = await upgradeDatabase(currentVersion, targetVersion);
        if (!success) {
          console.error('Database upgrade failed');
          return false;
        }
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
        isApproved: true, // Admin is always approved
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
        isApproved: true, // Test user is pre-approved for testing
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
    console.log(`Database version updated to ${version}`);
    return true;
  } catch (error) {
    console.error('Error updating database version:', error);
    return false;
  }
}

/**
 * Comprehensive database upgrade system
 * Handles incremental upgrades between versions while preserving data
 * @param {string} fromVersion - Current database version
 * @param {string} toVersion - Target database version
 * @returns {Promise<boolean>} Success flag
 */
export async function upgradeDatabase(fromVersion, toVersion) {
  try {
    console.log(`Starting database upgrade from ${fromVersion} to ${toVersion}`);
    
    // Create a backup before upgrading
    await createDatabaseBackup();
    
    // Define upgrade path - each version should know how to upgrade to the next
    const upgradePath = getUpgradePath(fromVersion, toVersion);
    
    if (upgradePath.length === 0) {
      console.log('No upgrade path needed or available');
      return true;
    }
    
    // Execute upgrades sequentially
    for (const step of upgradePath) {
      console.log(`Upgrading from ${step.from} to ${step.to}...`);
      const success = await executeUpgradeStep(step.from, step.to);
      if (!success) {
        console.error(`Upgrade step failed: ${step.from} → ${step.to}`);
        return false;
      }
      
      // Update version after each successful step
      await updateDatabaseVersion(step.to);
    }
    
    console.log(`Database upgrade completed successfully: ${fromVersion} → ${toVersion}`);
    return true;
  } catch (error) {
    console.error('Database upgrade error:', error);
    return false;
  }
}

/**
 * Get the upgrade path between two versions
 * @param {string} fromVersion 
 * @param {string} toVersion 
 * @returns {Array} Array of upgrade steps
 */
function getUpgradePath(fromVersion, toVersion) {
  const upgrades = [
    { from: '1.0.0', to: '2.0.0' },
    { from: '2.0.0', to: '2.1.0' }
  ];
  
  const path = [];
  let currentVersion = fromVersion;
  
  while (currentVersion !== toVersion) {
    const nextUpgrade = upgrades.find(u => u.from === currentVersion);
    if (!nextUpgrade) {
      console.error(`No upgrade path found from ${currentVersion} to ${toVersion}`);
      return [];
    }
    
    path.push(nextUpgrade);
    currentVersion = nextUpgrade.to;
    
    // Prevent infinite loops
    if (path.length > 10) {
      console.error('Upgrade path too long, possible infinite loop');
      return [];
    }
  }
  
  return path;
}

/**
 * Execute a single upgrade step
 * @param {string} fromVersion 
 * @param {string} toVersion 
 * @returns {Promise<boolean>} Success flag
 */
async function executeUpgradeStep(fromVersion, toVersion) {
  try {
    if (fromVersion === '1.0.0' && toVersion === '2.0.0') {
      return await upgrade_1_0_0_to_2_0_0();
    } else if (fromVersion === '2.0.0' && toVersion === '2.1.0') {
      return await upgrade_2_0_0_to_2_1_0();
    } else {
      console.error(`Unknown upgrade step: ${fromVersion} → ${toVersion}`);
      return false;
    }
  } catch (error) {
    console.error(`Upgrade step error (${fromVersion} → ${toVersion}):`, error);
    return false;
  }
}

/**
 * Upgrade from 1.0.0 to 2.0.0 - Add multi-user support
 * @returns {Promise<boolean>} Success flag
 */
async function upgrade_1_0_0_to_2_0_0() {
  try {
    console.log('Executing upgrade 1.0.0 → 2.0.0: Adding multi-user support');
    
    // Create default admin user if no users exist
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const adminUserId = await createDefaultAdminUser();
      
      // Migrate legacy data to the admin user if we created one
      if (adminUserId) {
        await migrateLegacyData(adminUserId);
      }
    }
    
    console.log('Upgrade 1.0.0 → 2.0.0 completed successfully');
    return true;
  } catch (error) {
    console.error('Upgrade 1.0.0 → 2.0.0 failed:', error);
    return false;
  }
}

/**
 * Upgrade from 2.0.0 to 2.1.0 - Add user approval workflow
 * @returns {Promise<boolean>} Success flag
 */
async function upgrade_2_0_0_to_2_1_0() {
  try {
    console.log('Executing upgrade 2.0.0 → 2.1.0: Adding user approval workflow');
    
    // Check if isApproved column exists by trying to query it
    let columnExists = false;
    try {
      await prisma.$queryRaw`SELECT isApproved FROM User LIMIT 1`;
      columnExists = true;
    } catch (error) {
      // Column doesn't exist, we need to add it
      columnExists = false;
    }
    
    if (!columnExists) {
      console.log('Adding isApproved column to User table');
      
      // Add the isApproved column with default value false
      await prisma.$executeRaw`ALTER TABLE User ADD COLUMN isApproved BOOLEAN DEFAULT 0`;
      
      console.log('isApproved column added successfully');
    } else {
      console.log('isApproved column already exists');
    }
    
    // Approve all existing users (they were created before approval system)
    const unapprovedCount = await prisma.user.count({
      where: { isApproved: false }
    });
    
    if (unapprovedCount > 0) {
      console.log(`Approving ${unapprovedCount} existing users`);
      
      await prisma.user.updateMany({
        where: { isApproved: false },
        data: { isApproved: true }
      });
      
      console.log('All existing users have been approved');
    }
    
    console.log('Upgrade 2.0.0 → 2.1.0 completed successfully');
    return true;
  } catch (error) {
    console.error('Upgrade 2.0.0 → 2.1.0 failed:', error);
    return false;
  }
}

/**
 * Create a database backup before upgrades
 * @returns {Promise<boolean>} Success flag
 */
async function createDatabaseBackup() {
  try {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || '../roboprep.db';
    const backupPath = `${dbPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    // Copy the database file
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`Database backup created: ${backupPath}`);
    } else {
      console.log('Database file not found for backup, continuing...');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating database backup:', error);
    // Don't fail the upgrade if backup fails, just warn
    console.warn('Continuing upgrade without backup');
    return true;
  }
}

/**
 * Check if database needs upgrade
 * @returns {Promise<{needsUpgrade: boolean, currentVersion: string, targetVersion: string}>}
 */
export async function checkUpgradeNeeded() {
  try {
    const currentVersion = await getDatabaseVersion();
    const targetVersion = process.env.DATABASE_TARGET_VERSION || '2.1.0';
    
    return {
      needsUpgrade: currentVersion !== targetVersion,
      currentVersion: currentVersion || 'unknown',
      targetVersion
    };
  } catch (error) {
    console.error('Error checking upgrade status:', error);
    return {
      needsUpgrade: false,
      currentVersion: 'error',
      targetVersion: 'unknown'
    };
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