import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { checkUserAuth } from './client-auth';

export async function POST(request) {
  try {
    // Check authentication without using middleware
    const authCheck = await checkUserAuth();
    if (!authCheck.isAuthenticated) {
      // For debugging, still allow the request but include auth info in response
      console.log('DB API: User not authenticated:', authCheck.message);
      // Uncomment to enforce authentication:
      // return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { operation, params } = await request.json();
    
    // Handle different database operations
    switch (operation) {
      case 'getSetting':
        return await handleGetSetting(params);
      case 'getSettings':
        return await handleGetSettings(params);
      case 'setSetting':
        return await handleSetSetting(params);
      case 'removeSetting':
        return await handleRemoveSetting(params);
      case 'getUserPrompts':
        return await handleGetUserPrompts();
      case 'getCorePrompts':
        return await handleGetCorePrompts();
      case 'getFavorites':
        return await handleGetFavorites();
      case 'getRecentlyUsed':
        return await handleGetRecentlyUsed();
      case 'getUserCategories':
        return await handleGetUserCategories();
      case 'getResponses':
        return await handleGetResponses();
      case 'getResponsesForPrompt':
        return await handleGetResponsesForPrompt(params);
      case 'saveResponse':
        return await handleSaveResponse(params);
      case 'deleteResponse':
        return await handleDeleteResponse(params);
      case 'countResponsesForPrompt':
        return await handleCountResponsesForPrompt(params);
      case 'storeUserPrompts':
        return await handleStoreUserPrompts(params);
      case 'storeCorePrompts':
        return await handleStoreCorePrompts(params);
      case 'addUserPrompts':
        return await handleAddUserPrompts(params);
      case 'storeFavorites':
        return await handleStoreFavorites(params);
      case 'storeRecentlyUsed':
        return await handleStoreRecentlyUsed(params);
      case 'storeUserCategories':
        return await handleStoreUserCategories(params);
      case 'addUserCategories':
        return await handleAddUserCategories(params);
      case 'storeResponses':
        return await handleStoreResponses(params);
      case 'addResponses':
        return await handleAddResponses(params);
      case 'clearData':
        return await handleClearData();
      case 'checkPromptExists':
        return await handleCheckPromptExists(params);
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

// Check if a prompt exists
async function handleCheckPromptExists({ promptId }) {
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId }
  });
  
  return NextResponse.json({ exists: !!prompt });
}

// Single setting retrieval
async function handleGetSetting({ key }) {
  const setting = await prisma.setting.findUnique({
    where: { key }
  });
  
  const value = setting ? JSON.parse(setting.value) : null;
  return NextResponse.json({ [key]: value });
}

// Multiple settings retrieval
async function handleGetSettings({ keys }) {
  
  const result = {};
  
  if (Array.isArray(keys)) {
    // Array of keys
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } }
    });
    
    
    // Create a map for quick lookups
    const settingsMap = new Map(
      settings.map(s => [s.key, JSON.parse(s.value)])
    );
    
    // Set values in result
    keys.forEach(key => {
      result[key] = settingsMap.has(key) ? settingsMap.get(key) : null;
    });
  } else if (typeof keys === 'object') {
    // Object with default values
    const settingKeys = Object.keys(keys);
    
    // If userPrompts is in the keys, also fetch all user prompts
    if (settingKeys.includes('userPrompts')) {
      const userPrompts = await prisma.prompt.findMany({
        where: { isUserCreated: true },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
      
      result.userPrompts = userPrompts.map(formatPromptFromDb);
    }
    
    // If corePrompts is in the keys, also fetch all core prompts
    if (settingKeys.includes('corePrompts')) {
      const corePrompts = await prisma.prompt.findMany({
        where: { isUserCreated: false },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
      
      result.corePrompts = corePrompts.map(formatPromptFromDb);
    }
    
    // Get other settings
    const filteredKeys = settingKeys.filter(k => 
      !['userPrompts', 'corePrompts'].includes(k)
    );
    
    if (filteredKeys.length > 0) {
      const settings = await prisma.setting.findMany({
        where: { key: { in: filteredKeys } }
      });
      
      // Create a map for quick lookups
      const settingsMap = new Map(
        settings.map(s => [s.key, JSON.parse(s.value)])
      );
      
      // Set values or defaults in result
      filteredKeys.forEach(key => {
        result[key] = settingsMap.has(key) ? settingsMap.get(key) : keys[key];
      });
    }
  }
  
  return NextResponse.json(result);
}

// Save setting
async function handleSetSetting({ key, value }) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) }
  });
  
  return NextResponse.json({ success: true });
}

// Remove setting
async function handleRemoveSetting({ key }) {
  try {
    await prisma.setting.delete({
      where: { key }
    });
  } catch (error) {
    // Ignore if not found
  }
  
  return NextResponse.json({ success: true });
}

// Get user prompts
async function handleGetUserPrompts() {
  console.log('handleGetUserPrompts called');
  
  const prompts = await prisma.prompt.findMany({
    where: { isUserCreated: true },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
  
  const formattedPrompts = prompts.map(formatPromptFromDb);
  
  return NextResponse.json(formattedPrompts);
}

// Get core prompts
async function handleGetCorePrompts() {
  const prompts = await prisma.prompt.findMany({
    where: { isUserCreated: false },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
  
  return NextResponse.json(prompts.map(formatPromptFromDb));
}

// Get favorites
async function handleGetFavorites() {
  try {
    console.log('Fetching favorites from database');
    const favorites = await prisma.favorite.findMany();
    const favoriteIds = favorites.map(f => f.promptId);
    console.log(`Found ${favoriteIds.length} favorites in database`);
    return NextResponse.json(favoriteIds);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json([]);
  }
}

// Get recently used
async function handleGetRecentlyUsed() {
  const recentlyUsed = await prisma.recentlyUsed.findMany({
    orderBy: {
      usedAt: 'desc'
    }
  });
  
  return NextResponse.json(recentlyUsed.map(r => r.promptId));
}

// Get user categories
async function handleGetUserCategories() {
  const categories = await prisma.category.findMany({
    where: { isUserCreated: true }
  });
  
  return NextResponse.json(categories.map(c => ({
    id: c.id,
    name: c.name,
    isUserCreated: true
  })));
}

// Get responses
async function handleGetResponses() {
  const responses = await prisma.response.findMany();
  return NextResponse.json(responses.map(formatResponseFromDb));
}

// Get responses for prompt
async function handleGetResponsesForPrompt({ promptId }) {
  const responses = await prisma.response.findMany({
    where: { promptId }
  });
  
  return NextResponse.json(responses.map(formatResponseFromDb));
}

// Save response
async function handleSaveResponse({ response }) {
  // Generate a unique ID if not provided
  if (!response.id) {
    response.id = `response_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
  
  // Ensure creation timestamp
  if (!response.createdAt) {
    response.createdAt = new Date().toISOString();
  }
  
  // Save to database
  const savedResponse = await prisma.response.create({
    data: {
      id: response.id,
      promptId: response.promptId,
      responseText: response.responseText,
      modelUsed: response.modelUsed,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      totalTokens: response.totalTokens,
      createdAt: new Date(response.createdAt),
      variablesUsed: response.variablesUsed ? JSON.stringify(response.variablesUsed) : null
    }
  });
  
  return NextResponse.json(formatResponseFromDb(savedResponse));
}

// Delete response
async function handleDeleteResponse({ responseId }) {
  try {
    const result = await prisma.response.delete({
      where: { id: responseId }
    });
    
    return NextResponse.json({ success: !!result });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}

// Count responses for prompt
async function handleCountResponsesForPrompt({ promptId }) {
  const count = await prisma.response.count({
    where: { promptId }
  });
  
  return NextResponse.json({ count });
}

// Store user prompts (replacing all)
async function handleStoreUserPrompts({ prompts }) {
  await storePrompts(prompts, true);
  return NextResponse.json({ success: true });
}

// Store core prompts (replacing all)
async function handleStoreCorePrompts({ prompts }) {
  await storePrompts(prompts, false);
  return NextResponse.json({ success: true });
}

// Add user prompts (appending to existing)
async function handleAddUserPrompts({ prompts }) {
  console.log('handleAddUserPrompts - Adding prompts:', prompts.length);
  await addPrompts(prompts, true);
  return NextResponse.json({ success: true });
}

// Store prompts helper (replacing all)
async function storePrompts(prompts, isUserCreated) {
  // Delete existing prompts of this type
  await prisma.prompt.deleteMany({
    where: { isUserCreated }
  });
  
  // Create new prompts with their tags
  for (const prompt of prompts) {
    await createPromptWithTags(prompt, isUserCreated);
  }
  
  return true;
}

// Add prompts helper (appending to existing)
async function addPrompts(prompts, isUserCreated) {
  let added = 0;
  let skipped = 0;
  
  // Create new prompts with their tags
  for (const prompt of prompts) {
    // Check if prompt already exists
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id: prompt.id }
    });
    
    // Skip if already exists
    if (existingPrompt) {
      skipped++;
      continue;
    }
    
    await createPromptWithTags(prompt, isUserCreated);
    added++;
  }
  
  return true;
}

// Helper to create a prompt with its tags
async function createPromptWithTags(prompt, isUserCreated) {
  // Extract tags
  const tags = prompt.tags || [];
  
  // Ensure prompt has all required fields
  const promptData = {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description || '',
    categoryId: prompt.category || null,
    promptText: prompt.promptText,
    isUserCreated,
    usageCount: prompt.usageCount || 0,
    createdAt: new Date(prompt.createdAt || new Date()),
    lastUsed: prompt.lastUsed ? new Date(prompt.lastUsed) : null,
    lastEdited: prompt.lastEdited ? new Date(prompt.lastEdited) : null,
  };
  
  // Create prompt
  try {
    await prisma.prompt.create({
      data: promptData
    });
    
    // Create tags if needed and connect to prompt
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
    
    return true;
  } catch (error) {
    console.error(`Error creating prompt ${prompt.title}:`, error);
    return false;
  }
}

// Store favorites
async function handleStoreFavorites({ favorites }) {
  console.log(`Storing ${favorites.length} favorites to database`);
  
  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing favorites
      await tx.favorite.deleteMany({});
      
      // Create new favorites
      for (const promptId of favorites) {
        // Check if prompt exists
        const promptExists = await tx.prompt.findUnique({
          where: { id: promptId }
        });
        
        if (promptExists) {
          await tx.favorite.create({
            data: { promptId }
          });
        } else {
          console.warn(`Skipping favorite for non-existent prompt: ${promptId}`);
        }
      }
    });
    
    // Verify the operation by fetching the updated favorites
    const updatedFavorites = await prisma.favorite.findMany();
    console.log(`Successfully stored ${updatedFavorites.length} favorites to database`);
    
    return NextResponse.json({ 
      success: true, 
      count: updatedFavorites.length,
      favorites: updatedFavorites.map(f => f.promptId)
    });
  } catch (error) {
    console.error('Error storing favorites:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Store recently used
async function handleStoreRecentlyUsed({ recentlyUsed }) {
  // Delete existing recently used
  await prisma.recentlyUsed.deleteMany({});
  
  // Create new recently used in order
  for (let i = 0; i < recentlyUsed.length; i++) {
    const promptId = recentlyUsed[i];
    
    // Check if prompt exists
    const promptExists = await prisma.prompt.findUnique({
      where: { id: promptId }
    });
    
    if (promptExists) {
      await prisma.recentlyUsed.create({
        data: {
          promptId,
          // Use offset to preserve order (newest first)
          usedAt: new Date(Date.now() - i * 1000)
        }
      });
    }
  }
  
  return NextResponse.json({ success: true });
}

// Store user categories (replacing all)
async function handleStoreUserCategories({ categories }) {
  // Delete existing user categories
  await prisma.category.deleteMany({
    where: { isUserCreated: true }
  });
  
  // Create new categories
  for (const category of categories) {
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        isUserCreated: true
      }
    });
  }
  
  return NextResponse.json({ success: true });
}

// Add user categories (appending to existing)
async function handleAddUserCategories({ categories }) {
  // Create new categories
  for (const category of categories) {
    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: category.id }
    });
    
    // Skip if already exists
    if (existingCategory) {
      continue;
    }
    
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        isUserCreated: true
      }
    });
  }
  
  return NextResponse.json({ success: true });
}

// Store responses (replacing all)
async function handleStoreResponses({ responses }) {
  // Delete existing responses
  await prisma.response.deleteMany({});
  
  // Create new responses
  for (const response of responses) {
    await prisma.response.create({
      data: {
        id: response.id,
        promptId: response.promptId,
        responseText: response.responseText,
        modelUsed: response.modelUsed,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        totalTokens: response.totalTokens,
        createdAt: new Date(response.createdAt),
        lastEdited: response.lastEdited ? new Date(response.lastEdited) : null,
        variablesUsed: response.variablesUsed ? JSON.stringify(response.variablesUsed) : null
      }
    });
  }
  
  return NextResponse.json({ success: true });
}

// Add responses (appending to existing)
async function handleAddResponses({ responses }) {
  // Create new responses
  for (const response of responses) {
    // Check if response already exists
    const existingResponse = await prisma.response.findUnique({
      where: { id: response.id }
    });
    
    // Skip if already exists
    if (existingResponse) {
      continue;
    }
    
    await prisma.response.create({
      data: {
        id: response.id,
        promptId: response.promptId,
        responseText: response.responseText,
        modelUsed: response.modelUsed,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        totalTokens: response.totalTokens,
        createdAt: new Date(response.createdAt),
        lastEdited: response.lastEdited ? new Date(response.lastEdited) : null,
        variablesUsed: response.variablesUsed ? JSON.stringify(response.variablesUsed) : null
      }
    });
  }
  
  return NextResponse.json({ success: true });
}

// Clear all data
async function handleClearData() {
  // Delete all data in all tables, maintaining referential integrity order
  await prisma.$transaction([
    prisma.response.deleteMany(),
    prisma.recentlyUsed.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.promptTag.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.prompt.deleteMany(),
    prisma.category.deleteMany(),
    prisma.setting.deleteMany()
  ]);
  
  return NextResponse.json({ success: true });
}

// Helper function to format prompt from database
function formatPromptFromDb(dbPrompt) {
  // Convert tags from junction objects to string array
  const tags = dbPrompt.tags.map(t => t.tag.name);
  
  return {
    id: dbPrompt.id,
    title: dbPrompt.title,
    description: dbPrompt.description || '',
    category: dbPrompt.categoryId || '',
    promptText: dbPrompt.promptText,
    tags: tags,
    isUserCreated: dbPrompt.isUserCreated,
    usageCount: dbPrompt.usageCount,
    createdAt: dbPrompt.createdAt.toISOString(),
    lastUsed: dbPrompt.lastUsed ? dbPrompt.lastUsed.toISOString() : null,
    lastEdited: dbPrompt.lastEdited ? dbPrompt.lastEdited.toISOString() : null
  };
}

// Helper function to format response from database
function formatResponseFromDb(dbResponse) {
  let variablesUsed = null;
  
  if (dbResponse.variablesUsed) {
    try {
      variablesUsed = JSON.parse(dbResponse.variablesUsed);
    } catch (error) {
      console.error('Error parsing variables used JSON:', error);
    }
  }
  
  return {
    id: dbResponse.id,
    promptId: dbResponse.promptId,
    responseText: dbResponse.responseText,
    modelUsed: dbResponse.modelUsed,
    promptTokens: dbResponse.promptTokens,
    completionTokens: dbResponse.completionTokens,
    totalTokens: dbResponse.totalTokens,
    createdAt: dbResponse.createdAt.toISOString(),
    lastEdited: dbResponse.lastEdited ? dbResponse.lastEdited.toISOString() : null,
    variablesUsed
  };
}