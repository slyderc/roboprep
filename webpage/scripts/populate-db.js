#!/usr/bin/env node

/**
 * Database population script
 * Run this script to populate the database with default data
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Import default prompts
const defaultPromptsPath = path.resolve(__dirname, '../src/data/prompts.json');
const defaultPrompts = JSON.parse(fs.readFileSync(defaultPromptsPath, 'utf8'));

// Create a Prisma client
const prisma = new PrismaClient();

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
    try {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {},
        create: category
      });
    } catch (error) {
      console.error(`Error creating category ${category.id}:`, error);
    }
  }
}

async function createDefaultPrompts() {
  console.log(`Creating ${defaultPrompts.length} default prompts`);
  
  for (const prompt of defaultPrompts) {
    try {
      // Extract tags
      const tags = prompt.tags || [];
      
      // Create the prompt
      await prisma.prompt.upsert({
        where: { id: prompt.id },
        update: {},
        create: {
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
        try {
          // Find or create tag
          let tag = await prisma.tag.findFirst({
            where: { name: tagName }
          });
          
          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: tagName }
            });
          }
          
          // Create prompt-tag relationship (ignore if already exists)
          await prisma.promptTag.upsert({
            where: {
              promptId_tagId: {
                promptId: prompt.id,
                tagId: tag.id
              }
            },
            update: {},
            create: {
              promptId: prompt.id,
              tagId: tag.id
            }
          });
        } catch (error) {
          console.error(`Error creating tag ${tagName} for prompt ${prompt.id}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error creating prompt ${prompt.id}:`, error);
    }
  }
}

async function createDefaultSettings() {
  const defaultSettings = [
    { key: 'fontSize', value: JSON.stringify('medium') },
    { key: 'theme', value: JSON.stringify('light') }
  ];

  console.log(`Creating ${defaultSettings.length} default settings`);
  
  // Clean up any existing settings
  try {
    await prisma.setting.deleteMany();
  } catch (error) {
    console.error('Error clearing settings:', error);
  }
  
  for (const setting of defaultSettings) {
    try {
      await prisma.setting.create({
        data: setting
      });
      console.log(`Created setting: ${setting.key}`);
    } catch (error) {
      console.error(`Error creating setting ${setting.key}:`, error);
    }
  }
}

async function initializeDatabase() {
  try {
    // Create database info record
    await prisma.databaseInfo.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        version: process.env.DATABASE_INIT_VERSION || '1.0.0',
      }
    });
    
    // Create default data
    await createDefaultCategories();
    await createDefaultPrompts();
    await createDefaultSettings();
    
    console.log('Database populated with default data');
    return true;
  } catch (error) {
    console.error('Database population error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('Database population complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });