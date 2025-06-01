#!/usr/bin/env node

/**
 * Production Database Upgrade Script
 * 
 * This script performs a complete production upgrade including:
 * 1. Database schema upgrade
 * 2. Prisma client regeneration
 * 3. Application rebuild
 * 4. Verification steps
 * 
 * Usage:
 *   node scripts/production-upgrade.js              # Full upgrade process
 *   node scripts/production-upgrade.js --check      # Check status only
 *   node scripts/production-upgrade.js --db-only    # Database upgrade only
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
 */
async function checkUpgradeNeeded() {
  const currentVersion = await getDatabaseVersion();
  const targetVersion = TARGET_VERSION;
  
  if (!currentVersion) {
    return {
      needsUpgrade: true,
      currentVersion: null,
      targetVersion,
      upgradeType: 'initialization'
    };
  }
  
  const needsUpgrade = currentVersion !== targetVersion;
  
  return {
    needsUpgrade,
    currentVersion,
    targetVersion,
    upgradeType: needsUpgrade ? 'upgrade' : 'current'
  };
}

/**
 * Create database backup
 */
async function createBackup(fromVersion, toVersion) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `roboprep-backup-v${fromVersion}-to-v${toVersion}-${timestamp}.db`;
  const backupPath = path.join(process.cwd(), '..', backupName);
  
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
 */
async function upgrade_2_0_0_to_2_1_0() {
  try {
    console.log('Executing upgrade 2.0.0 → 2.1.0: Adding user approval workflow');
    
    // Check if isApproved column exists
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
    
    // Approve all existing users
    const unapprovedResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM User WHERE isApproved = 0 OR isApproved IS NULL
    `;
    const unapprovedCount = unapprovedResult[0]?.count || 0;
    
    if (unapprovedCount > 0) {
      console.log(`Approving ${unapprovedCount} existing users`);
      await prisma.$executeRaw`
        UPDATE User SET isApproved = 1 WHERE isApproved = 0 OR isApproved IS NULL
      `;
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
 */
async function setDatabaseVersion(version) {
  try {
    const existing = await prisma.databaseInfo.findFirst();
    
    if (existing) {
      await prisma.databaseInfo.update({
        where: { id: existing.id },
        data: { version }
      });
    } else {
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
 */
async function upgradeDatabase(fromVersion, toVersion) {
  try {
    console.log(`\\n🔄 Starting database upgrade: ${fromVersion || 'uninitialized'} → ${toVersion}`);
    
    // Create backup before upgrade
    if (fromVersion) {
      await createBackup(fromVersion, toVersion);
    }
    
    // Initialize if no current version
    if (!fromVersion) {
      console.log(`📦 Initializing database to version ${INIT_VERSION}`);
      if (!await setDatabaseVersion(INIT_VERSION)) {
        throw new Error('Failed to initialize database version');
      }
      fromVersion = INIT_VERSION;
    }
    
    // Perform upgrade
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

/**
 * Regenerate Prisma client
 */
async function regeneratePrismaClient() {
  console.log('🔄 Regenerating Prisma client...');
  try {
    const { stdout, stderr } = await execAsync('npx prisma generate', { cwd: process.cwd() });
    if (stderr && !stderr.includes('Generated Prisma Client')) {
      console.warn('Prisma generate warnings:', stderr);
    }
    console.log('✅ Prisma client regenerated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to regenerate Prisma client:', error.message);
    return false;
  }
}

/**
 * Rebuild application
 */
async function rebuildApplication() {
  console.log('🏗️  Rebuilding application...');
  try {
    const { stdout, stderr } = await execAsync('npm run build', { cwd: process.cwd() });
    console.log('✅ Application rebuilt successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to rebuild application:', error.message);
    console.log('Build output:', error.stdout);
    return false;
  }
}

/**
 * Verify upgrade success
 */
async function verifyUpgrade(expectedVersion) {
  console.log('🔍 Verifying upgrade...');
  try {
    const currentVersion = await getDatabaseVersion();
    if (currentVersion === expectedVersion) {
      console.log('✅ Database version verification passed');
      return true;
    } else {
      console.log(`❌ Version mismatch: expected ${expectedVersion}, got ${currentVersion}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// CLI Interface
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const dbOnly = args.includes('--db-only');

async function main() {
  console.log('🚀 RoboPrep Production Upgrade Tool');
  console.log('=====================================\\n');

  try {
    // Check current status
    console.log('Checking system status...');
    const upgradeInfo = await checkUpgradeNeeded();

    console.log(`📊 Current Version: ${upgradeInfo.currentVersion || 'Uninitialized'}`);
    console.log(`🎯 Target Version:  ${upgradeInfo.targetVersion}`);
    console.log(`📈 Status:         ${upgradeInfo.needsUpgrade ? '⚠️  Upgrade Available' : '✅ Up to Date'}\\n`);

    if (checkOnly) {
      console.log('ℹ️  Check complete (--check flag specified)');
      if (upgradeInfo.needsUpgrade) {
        console.log('\\n💡 To upgrade, run: node scripts/production-upgrade.js');
        process.exit(1);
      }
      process.exit(0);
    }

    if (!upgradeInfo.needsUpgrade) {
      console.log('✅ Database is already up to date!');
      process.exit(0);
    }

    // Perform upgrade steps
    console.log('🚀 Starting production upgrade process...\\n');

    // Step 1: Database upgrade
    console.log('📍 Step 1: Database Schema Upgrade');
    const dbSuccess = await upgradeDatabase(
      upgradeInfo.currentVersion,
      upgradeInfo.targetVersion
    );

    if (!dbSuccess) {
      console.log('❌ Database upgrade failed! Stopping here.');
      process.exit(1);
    }

    if (dbOnly) {
      console.log('\\n✅ Database-only upgrade completed (--db-only flag specified)');
      console.log('📝 Manual steps still required:');
      console.log('   1. Regenerate Prisma client: npx prisma generate');
      console.log('   2. Rebuild application: npm run build');
      console.log('   3. Restart application server');
      process.exit(0);
    }

    // Step 2: Regenerate Prisma client
    console.log('\\n📍 Step 2: Prisma Client Regeneration');
    const prismaSuccess = await regeneratePrismaClient();

    if (!prismaSuccess) {
      console.log('⚠️  Prisma regeneration failed, but database upgrade succeeded');
      console.log('📝 Manual steps required:');
      console.log('   1. Run: npx prisma generate');
      console.log('   2. Run: npm run build');
      console.log('   3. Restart application server');
      process.exit(1);
    }

    // Step 3: Rebuild application
    console.log('\\n📍 Step 3: Application Rebuild');
    const buildSuccess = await rebuildApplication();

    if (!buildSuccess) {
      console.log('⚠️  Application rebuild failed, but database and Prisma are updated');
      console.log('📝 Manual steps required:');
      console.log('   1. Fix build issues');
      console.log('   2. Run: npm run build');
      console.log('   3. Restart application server');
      process.exit(1);
    }

    // Step 4: Verify
    console.log('\\n📍 Step 4: Verification');
    const verifySuccess = await verifyUpgrade(upgradeInfo.targetVersion);

    if (!verifySuccess) {
      console.log('⚠️  Verification failed, manual check required');
      process.exit(1);
    }

    // Success!
    console.log('\\n🎉 Production upgrade completed successfully!');
    console.log(`📈 Database version: ${upgradeInfo.currentVersion || 'uninitialized'} → ${upgradeInfo.targetVersion}`);
    console.log('\\n📝 Final steps:');
    console.log('   1. Restart your application server');
    console.log('   2. Verify admin dashboard loads correctly');
    console.log('   3. Test user authentication and approval workflow');

  } catch (error) {
    console.error('\\n💥 Production upgrade failed:', error.message);
    console.error('🔍 Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 RoboPrep Production Upgrade Tool

Usage:
  node scripts/production-upgrade.js              Complete production upgrade
  node scripts/production-upgrade.js --check      Check upgrade status only
  node scripts/production-upgrade.js --db-only    Database upgrade only
  node scripts/production-upgrade.js --help       Show this help message

Complete Upgrade Process:
  1. Database schema upgrade with backup
  2. Prisma client regeneration  
  3. Application rebuild
  4. Verification and validation

This tool handles the complete upgrade cycle to avoid the Prisma client
validation issues that occur when schema changes but client is outdated.
`);
  process.exit(0);
}

main().catch(console.error);