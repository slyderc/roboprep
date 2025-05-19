#!/usr/bin/env node

/**
 * Database initialization script
 * Run this script to create and initialize the database with default data
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the root directory of the project
const rootDir = path.resolve(__dirname, '..');
const dbFilePath = process.env.DATABASE_URL?.replace('file:', '') || path.resolve(rootDir, '../roboprep.db');

console.log('RoboPrep Database Initialization');
console.log('------------------------------');
console.log(`Database path: ${dbFilePath}`);

// Check if the database file exists
if (fs.existsSync(dbFilePath)) {
  console.log('Database file already exists.');
  
  // Ask if user wants to reset the database
  if (process.argv.includes('--reset') || process.argv.includes('-r')) {
    console.log('Resetting database...');
    try {
      // Run the Prisma migration reset command
      execSync('npx prisma migrate reset --force', { 
        cwd: rootDir,
        stdio: 'inherit'
      });
      console.log('Database reset successfully.');
    } catch (error) {
      console.error('Error resetting database:', error);
      process.exit(1);
    }
  }
} else {
  console.log('Database file does not exist. Creating new database...');
  try {
    // Run the Prisma migration dev command to create the database
    execSync('npx prisma migrate dev --name init', { 
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('Database created successfully.');
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  }
}

// Import the initialization function
try {
  console.log('Initializing database with default data...');
  
  // Launch Next.js app script to populate database
  execSync('node scripts/populate-db.js', { 
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  console.log('Database initialization complete.');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

console.log('Database setup finished successfully!');