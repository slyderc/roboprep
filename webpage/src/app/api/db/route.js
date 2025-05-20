import { NextResponse } from 'next/server';
import { prisma, getDbStats } from '../../../lib/db';
import { checkUserAuth } from './client-auth';

export async function POST(request) {
  try {
    // Check authentication without using middleware
    const authCheck = await checkUserAuth();
    if (!authCheck.isAuthenticated) {
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
      case 'getDbStats':
        return await handleGetDbStats();
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

// Get database statistics
async function handleGetDbStats() {
  const stats = await getDbStats();
  return NextResponse.json(stats);
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
    // Get authenticated user
    const authCheck = await checkUserAuth();
    if (!authCheck.isAuthenticated) {
      return NextResponse.json([]);
    }
    
    const userId = authCheck.user.id;
    
    // Get user's favorites
    const favorites = await prisma.userFavorite.findMany({
      where: { userId }
    });
    
    const favoriteIds = favorites.map(f => f.promptId);
    return NextResponse.json(favoriteIds);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json([]);
  }
}

// Get recently used
async function handleGetRecentlyUsed() {
  try {
    // Get authenticated user
    const authCheck = await checkUserAuth();
    if (!authCheck.isAuthenticated) {
      return NextResponse.json([]);
    }
    
    const userId = authCheck.user.id;
    
    // Get user's recently used prompts
    const recentlyUsed = await prisma.userRecentlyUsed.findMany({
      where: { userId },
      orderBy: {
        usedAt: 'desc'
      }
    });
    
    const recentlyUsedIds = recentlyUsed.map(r => r.promptId);
    return NextResponse.json(recentlyUsedIds);
  } catch (error) {
    console.error('Error fetching recently used prompts:', error);
    return NextResponse.json([]);
  }
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
  try {
    const responses = await prisma.response.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(responses.map(formatResponseFromDb));
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json([]);
  }
}

// Get responses for prompt
async function handleGetResponsesForPrompt({ promptId }) {
  try {
    const responses = await prisma.response.findMany({
      where: { promptId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(responses.map(formatResponseFromDb));
  } catch (error) {
    console.error(`Error fetching responses for prompt ${promptId}:`, error);
    return NextResponse.json([]);
  }
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
  
  try {
    // Get the authenticated user (if any)
    const authCheck = await checkUserAuth();
    const userId = authCheck.isAuthenticated ? authCheck.user.id : null;
    
    // Check if response with this ID already exists
    const existingResponse = await prisma.response.findUnique({
      where: { id: response.id }
    });
    
    let savedResponse;
    
    if (existingResponse) {
      // Update existing response
      savedResponse = await prisma.response.update({
        where: { id: response.id },
        data: {
          responseText: response.responseText,
          modelUsed: response.modelUsed || existingResponse.modelUsed,
          promptTokens: response.promptTokens || existingResponse.promptTokens,
          completionTokens: response.completionTokens || existingResponse.completionTokens,
          totalTokens: response.totalTokens || existingResponse.totalTokens,
          lastEdited: new Date(),
          variablesUsed: response.variablesUsed ? JSON.stringify(response.variablesUsed) : existingResponse.variablesUsed
        }
      });
    } else {
      // Create new response
      savedResponse = await prisma.response.create({
        data: {
          id: response.id,
          promptId: response.promptId,
          userId: userId, // Associate with current user
          responseText: response.responseText,
          modelUsed: response.modelUsed,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
          totalTokens: response.totalTokens,
          createdAt: new Date(response.createdAt),
          variablesUsed: response.variablesUsed ? JSON.stringify(response.variablesUsed) : null
        }
      });
    }
    
    // Get the response with user data for display
    const responseWithUser = await prisma.response.findUnique({
      where: { id: savedResponse.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    return NextResponse.json(formatResponseFromDb(responseWithUser));
  } catch (error) {
    console.error(`Error saving response ${response.id}:`, error);
    throw error;
  }
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
  // Get all existing prompts of this type
  const existingPrompts = await prisma.prompt.findMany({
    where: { isUserCreated },
    include: { responses: true }
  });
  
  // Create a map of existing prompt IDs
  const existingPromptsMap = new Map(existingPrompts.map(p => [p.id, p]));
  
  // Create a set of prompt IDs that we're going to update
  const newPromptIds = new Set(prompts.map(p => p.id));
  
  // Start a transaction
  await prisma.$transaction(async (tx) => {
    // 1. Delete prompts that aren't in the new set (avoiding those with responses)
    for (const existingPrompt of existingPrompts) {
      if (!newPromptIds.has(existingPrompt.id) && existingPrompt.responses.length === 0) {
        await tx.prompt.delete({
          where: { id: existingPrompt.id }
        });
      }
    }
    
    // 2. Update or create each prompt
    for (const prompt of prompts) {
      const exists = existingPromptsMap.has(prompt.id);
      
      // Extract tags
      const tags = prompt.tags || [];
      
      // Prepare prompt data
      const promptData = {
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
      
      if (exists) {
        // Update existing prompt
        await tx.prompt.update({
          where: { id: prompt.id },
          data: promptData
        });
        
        // Delete existing tags for this prompt
        await tx.promptTag.deleteMany({
          where: { promptId: prompt.id }
        });
      } else {
        // Create new prompt
        await tx.prompt.create({
          data: {
            id: prompt.id,
            ...promptData
          }
        });
      }
      
      // Create tags if needed and connect to prompt
      for (const tagName of tags) {
        // Find or create tag
        let tag = await tx.tag.findFirst({
          where: { name: tagName }
        });
        
        if (!tag) {
          tag = await tx.tag.create({
            data: { name: tagName }
          });
        }
        
        // Create prompt-tag relationship
        await tx.promptTag.create({
          data: {
            promptId: prompt.id,
            tagId: tag.id
          }
        });
      }
    }
  });
  
  
  return true;
}

// Add prompts helper (appending to existing)
async function addPrompts(prompts, isUserCreated) {
  let added = 0;
  let skipped = 0;
  
  // Start a transaction
  await prisma.$transaction(async (tx) => {
    // Create new prompts with their tags
    for (const prompt of prompts) {
      // Check if prompt already exists
      const existingPrompt = await tx.prompt.findUnique({
        where: { id: prompt.id }
      });
      
      // Skip if already exists
      if (existingPrompt) {
        skipped++;
        continue;
      }
      
      // Extract tags
      const tags = prompt.tags || [];
      
      // Create prompt
      await tx.prompt.create({
        data: {
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
        }
      });
      
      // Create tags if needed and connect to prompt
      for (const tagName of tags) {
        // Find or create tag
        let tag = await tx.tag.findFirst({
          where: { name: tagName }
        });
        
        if (!tag) {
          tag = await tx.tag.create({
            data: { name: tagName }
          });
        }
        
        // Create prompt-tag relationship
        await tx.promptTag.create({
          data: {
            promptId: prompt.id,
            tagId: tag.id
          }
        });
      }
      
      added++;
    }
  });
  
  return true;
}

// This function has been refactored and incorporated directly into storePrompts and addPrompts

// Store favorites
async function handleStoreFavorites({ favorites }) {
  try {
    // Get authenticated user
    const authCheck = await checkUserAuth();
    if (!authCheck.isAuthenticated) {
      console.log('User not authenticated, cannot store favorites');
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    
    const userId = authCheck.user.id;
    
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing user favorites
      await tx.userFavorite.deleteMany({
        where: { userId }
      });
      
      // Create new user favorites
      for (const promptId of favorites) {
        // Check if prompt exists
        const promptExists = await tx.prompt.findUnique({
          where: { id: promptId }
        });
        
        if (promptExists) {
          await tx.userFavorite.create({
            data: { 
              userId,
              promptId 
            }
          });
        } else {
          console.warn(`Skipping favorite for non-existent prompt: ${promptId}`);
        }
      }
    });
    
    // Verify the operation by fetching the updated favorites
    const updatedFavorites = await prisma.userFavorite.findMany({
      where: { userId }
    });
    
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
  try {
    // Get authenticated user
    const authCheck = await checkUserAuth();
    if (!authCheck.isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    
    const userId = authCheck.user.id;
    
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing user recently used
      await tx.userRecentlyUsed.deleteMany({
        where: { userId }
      });
      
      // Create new recently used in order
      for (let i = 0; i < recentlyUsed.length; i++) {
        const promptId = recentlyUsed[i];
        
        // Check if prompt exists
        const promptExists = await tx.prompt.findUnique({
          where: { id: promptId }
        });
        
        if (promptExists) {
          await tx.userRecentlyUsed.create({
            data: {
              userId,
              promptId,
              // Use offset to preserve order (newest first)
              usedAt: new Date(Date.now() - i * 1000)
            }
          });
        } else {
          console.warn(`Skipping recently used for non-existent prompt: ${promptId}`);
        }
      }
    });
    
    // Verify the operation
    const updatedRecentlyUsed = await prisma.userRecentlyUsed.findMany({
      where: { userId },
      orderBy: { usedAt: 'desc' }
    });
    
    return NextResponse.json({ 
      success: true, 
      count: updatedRecentlyUsed.length
    });
  } catch (error) {
    console.error('Error storing recently used prompts:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
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
  try {
    
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing responses
      await tx.response.deleteMany({});
      
      // Create new responses
      for (const response of responses) {
        if (!response.id || !response.promptId) {
          continue;
        }
        
        await tx.response.create({
          data: {
            id: response.id,
            promptId: response.promptId,
            responseText: response.responseText || '',
            modelUsed: response.modelUsed,
            promptTokens: response.promptTokens,
            completionTokens: response.completionTokens,
            totalTokens: response.totalTokens,
            createdAt: new Date(response.createdAt || Date.now()),
            lastEdited: response.lastEdited ? new Date(response.lastEdited) : null,
            variablesUsed: response.variablesUsed ? JSON.stringify(response.variablesUsed) : null
          }
        });
      }
    });
    
    // Verify operation
    const count = await prisma.response.count();
    
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Failed to store responses:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Add responses (appending to existing)
async function handleAddResponses({ responses }) {
  try {
    let added = 0;
    let skipped = 0;
    
    // Create new responses one by one
    for (const response of responses) {
      if (!response.id || !response.promptId) {
        skipped++;
        continue;
      }
      
      // Check if response already exists
      const existingResponse = await prisma.response.findUnique({
        where: { id: response.id }
      });
      
      // Skip if already exists
      if (existingResponse) {
        skipped++;
        continue;
      }
      
      await prisma.response.create({
        data: {
          id: response.id,
          promptId: response.promptId,
          responseText: response.responseText || '',
          modelUsed: response.modelUsed,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
          totalTokens: response.totalTokens,
          createdAt: new Date(response.createdAt || Date.now()),
          lastEdited: response.lastEdited ? new Date(response.lastEdited) : null,
          variablesUsed: response.variablesUsed ? JSON.stringify(response.variablesUsed) : null
        }
      });
      added++;
    }
    
    return NextResponse.json({ success: true, added, skipped });
  } catch (error) {
    console.error('Failed to add responses:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Clear all data
async function handleClearData() {
  // Get authenticated user
  const authCheck = await checkUserAuth();
  if (!authCheck.isAuthenticated || !authCheck.user.isAdmin) {
    console.log('User not authenticated or not admin, cannot clear data');
    return NextResponse.json({
      success: false,
      error: 'Admin privileges required'
    }, { status: 401 });
  }

  try {
    
    // Delete all data in all tables, maintaining referential integrity order
    await prisma.$transaction([
      prisma.response.deleteMany(),
      prisma.userRecentlyUsed.deleteMany(),
      prisma.userFavorite.deleteMany(),
      prisma.promptTag.deleteMany(),
      prisma.tag.deleteMany(),
      prisma.prompt.deleteMany(),
      prisma.category.deleteMany(),
      prisma.setting.deleteMany(),
      prisma.userSetting.deleteMany(),
      // Don't delete users and sessions to preserve authentication
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
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
  
  const formattedResponse = {
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

  // Include user information if available
  if (dbResponse.user) {
    formattedResponse.user = {
      firstName: dbResponse.user.firstName,
      lastName: dbResponse.user.lastName
    };
  }
  
  return formattedResponse;
}