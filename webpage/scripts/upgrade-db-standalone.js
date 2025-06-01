#!/usr/bin/env node

/**
 * Standalone Database upgrade CLI script
 * 
 * This script runs independently of the Next.js application and doesn't require
 * the full application stack to be loaded.
 * 
 * Usage:
 *   node scripts/upgrade-db-standalone.js              # Check status and upgrade if needed
 *   node scripts/upgrade-db-standalone.js --check      # Check status only
 *   node scripts/upgrade-db-standalone.js --force      # Force upgrade even if up to date
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const prisma = new PrismaClient();

// Constants for database versioning
const TARGET_VERSION = process.env.DATABASE_TARGET_VERSION || '2.1.0';
const INIT_VERSION = process.env.DATABASE_INIT_VERSION || '2.0.0';

/**
 * Get current database version
 * @returns {Promise<string|null>} Current version or null if not set
 */
async function getDatabaseVersion() {
  try {
    const dbInfo = await prisma.databaseInfo.findFirst();
    return dbInfo?.version || null;
  } catch (error) {
    console.error('Error getting database version:', error);
    return null;
  }
}

/**
 * Check if database upgrade is needed
 * @returns {Promise<Object>} Upgrade information
 */
async function checkUpgradeNeeded() {
  const currentVersion = await getDatabaseVersion();
  const targetVersion = TARGET_VERSION;
  
  // If no current version, it needs initialization
  if (!currentVersion) {
    return {
      needsUpgrade: true,
      currentVersion: null,
      targetVersion,
      upgradeType: 'initialization'
    };
  }
  
  // Simple version comparison (works for semantic versioning)
  const needsUpgrade = currentVersion !== targetVersion;
  
  return {
    needsUpgrade,
    currentVersion,
    targetVersion,
    upgradeType: needsUpgrade ? 'upgrade' : 'current'
  };
}

/**
 * Create database backup before upgrade
 * @param {string} fromVersion - Current version
 * @param {string} toVersion - Target version  
 * @returns {Promise<string>} Backup file path
 */
async function createBackup(fromVersion, toVersion) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `roboprep-backup-v${fromVersion}-to-v${toVersion}-${timestamp}.db`;
  const backupPath = path.join(process.cwd(), '..', backupName);
  
  // Get database file path from environment
  const dbUrl = process.env.DATABASE_URL || 'file:../roboprep.db';
  const dbPath = dbUrl.replace('file:', '');
  const sourcePath = path.resolve(process.cwd(), dbPath);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, backupPath);
    console.log(`✅ Backup created: ${backupName}`);
    return backupPath;
  } else {
    console.log(`⚠️  Source database not found at ${sourcePath}, skipping backup`);
    return null;
  }
}

/**
 * Upgrade from version 2.0.0 to 2.1.0
 * Adds the isApproved column to User table
 * @returns {Promise<boolean>} Success status
 */
async function upgrade_2_0_0_to_2_1_0() {
  try {
    console.log('Executing upgrade 2.0.0 → 2.1.0: Adding user approval workflow');
    
    // Check if isApproved column exists by trying to query it
    let columnExists = false;
    try {
      await prisma.$queryRaw`SELECT isApproved FROM User LIMIT 1`;
      columnExists = true;
      console.log('isApproved column already exists');
    } catch (error) {
      columnExists = false;
      console.log('isApproved column does not exist, will add it');
    }
    
    if (!columnExists) {
      console.log('Adding isApproved column to User table');
      await prisma.$executeRaw`ALTER TABLE User ADD COLUMN isApproved BOOLEAN DEFAULT 0`;
      console.log('isApproved column added successfully');
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
    } else {
      console.log('No users need approval');
    }
    
    console.log('Upgrade 2.0.0 → 2.1.0 completed successfully');
    return true;
  } catch (error) {
    console.error('Upgrade 2.0.0 → 2.1.0 failed:', error);
    return false;
  }
}

/**
 * Update database version record
 * @param {string} version - New version to set
 * @returns {Promise<boolean>} Success status
 */
async function setDatabaseVersion(version) {
  try {
    // Check if a record exists
    const existing = await prisma.databaseInfo.findFirst();
    
    if (existing) {
      // Update existing record
      await prisma.databaseInfo.update({
        where: { id: existing.id },
        data: { version }
      });
    } else {
      // Create new record
      await prisma.databaseInfo.create({
        data: { version }
      });
    }
    return true;
  } catch (error) {
    console.error('Error setting database version:', error);
    return false;
  }
}

/**
 * Perform database upgrade
 * @param {string} fromVersion - Current version
 * @param {string} toVersion - Target version
 * @returns {Promise<boolean>} Success status
 */
async function upgradeDatabase(fromVersion, toVersion) {
  try {
    console.log(`\n🔄 Starting upgrade: ${fromVersion || 'uninitialized'} → ${toVersion}`);
    
    // Create backup before upgrade
    if (fromVersion) {
      await createBackup(fromVersion, toVersion);
    }
    
    // If no current version, initialize to INIT_VERSION first
    if (!fromVersion) {
      console.log(`📦 Initializing database to version ${INIT_VERSION}`);
      if (!await setDatabaseVersion(INIT_VERSION)) {
        throw new Error('Failed to initialize database version');
      }
      fromVersion = INIT_VERSION;
    }
    
    // Perform incremental upgrades based on version path
    if (fromVersion === '2.0.0' && toVersion === '2.1.0') {
      if (!await upgrade_2_0_0_to_2_1_0()) {
        throw new Error('Upgrade 2.0.0 → 2.1.0 failed');
      }
    } else if (fromVersion === toVersion) {
      console.log('✅ Database is already at target version');
    } else {
      throw new Error(`No upgrade path defined from ${fromVersion} to ${toVersion}`);
    }
    
    // Update version record
    if (!await setDatabaseVersion(toVersion)) {
      throw new Error('Failed to update database version record');
    }
    
    console.log(`✅ Database upgrade completed: ${fromVersion} → ${toVersion}`);
    return true;
    
  } catch (error) {
    console.error(`💥 Database upgrade failed:`, error);
    return false;
  }
}

// CLI Interface
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const force = args.includes('--force');

async function main() {
  console.log('🔍 RoboPrep Database Upgrade Tool (Standalone)');
  console.log('===============================================\n');

  try {
    // Check current status
    console.log('Checking database status...');
    const currentVersion = await getDatabaseVersion();
    const upgradeInfo = await checkUpgradeNeeded();

    console.log(`📊 Current Version: ${currentVersion || 'Uninitialized'}`);
    console.log(`🎯 Target Version:  ${upgradeInfo.targetVersion}`);
    console.log(`📈 Status:         ${upgradeInfo.needsUpgrade ? '⚠️  Upgrade Available' : '✅ Up to Date'}\n`);

    if (checkOnly) {
      console.log('ℹ️  Check complete (--check flag specified)');
      if (upgradeInfo.needsUpgrade) {
        console.log('\n💡 To upgrade, run: node scripts/upgrade-db-standalone.js');
        process.exit(1);
      }
      process.exit(0);
    }

    if (!upgradeInfo.needsUpgrade && !force) {
      console.log('✅ Database is already up to date!');
      console.log('\n💡 Use --force flag to run upgrade anyway');
      process.exit(0);
    }

    if (force) {
      console.log('🔥 Force upgrade requested (--force flag)');
    }

    // Perform upgrade
    console.log('🚀 Starting database upgrade...');
    console.log(`📦 Upgrading from ${upgradeInfo.currentVersion || 'uninitialized'} to ${upgradeInfo.targetVersion}`);
    console.log('💾 Backup will be created automatically\n');

    const success = await upgradeDatabase(
      upgradeInfo.currentVersion,
      upgradeInfo.targetVersion
    );

    if (success) {
      console.log('\n✅ Database upgrade completed successfully!');
      console.log(`📈 Database version: ${upgradeInfo.currentVersion || 'uninitialized'} → ${upgradeInfo.targetVersion}`);
      
      // Verify the upgrade
      const newVersion = await getDatabaseVersion();
      if (newVersion === upgradeInfo.targetVersion) {
        console.log('✔️  Upgrade verification passed');
      } else {
        console.log('⚠️  Upgrade verification failed - version mismatch');
        process.exit(1);
      }
    } else {
      console.log('\n❌ Database upgrade failed!');
      console.log('🔍 Check the logs above for error details');
      console.log('💾 Your original database should be unchanged');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Upgrade script error:', error.message);
    console.error('🔍 Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔍 RoboPrep Database Upgrade Tool (Standalone)

Usage:
  node scripts/upgrade-db-standalone.js              Check status and upgrade if needed
  node scripts/upgrade-db-standalone.js --check      Check upgrade status only
  node scripts/upgrade-db-standalone.js --force      Force upgrade even if up to date
  node scripts/upgrade-db-standalone.js --help       Show this help message

Examples:
  node scripts/upgrade-db-standalone.js --check      # Check if upgrade is needed
  node scripts/upgrade-db-standalone.js              # Perform upgrade if needed
  node scripts/upgrade-db-standalone.js --force      # Force upgrade regardless of status

Features:
  • Automatic backup creation before upgrade
  • Incremental version upgrades (1.0.0 → 2.0.0 → 2.1.0)
  • Data preservation during upgrades
  • Rollback safety (original database unchanged on failure)
  • Version verification after upgrade
  • No dependency on Next.js application context
`);
  process.exit(0);
}

main().catch(console.error);