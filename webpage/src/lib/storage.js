/**
 * Database storage API for the RoboPrep application
 * Replaces the previous localStorage implementation with a relational database
 */
import { prisma, initializeDatabase } from './db';

// Initialize the database when module loads
initializeDatabase().catch(console.error);

const storage = {
  /**
   * Get data from the database
   * @param {string|string[]|Object} keys - Key(s) to retrieve or object with default values
   * @returns {Promise<Object>} Object with requested keys and their values
   */
  get: async (keys) => {
    const result = {};
    
    try {
      // Handle single string key
      if (typeof keys === 'string') {
        const setting = await prisma.setting.findUnique({
          where: { key: keys }
        });
        result[keys] = setting ? JSON.parse(setting.value) : null;
      } 
      // Handle array of keys
      else if (Array.isArray(keys)) {
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
      } 
      // Handle object with default values
      else {
        const settingKeys = Object.keys(keys);
        const settings = await prisma.setting.findMany({
          where: { key: { in: settingKeys } }
        });
        
        // Create a map for quick lookups
        const settingsMap = new Map(
          settings.map(s => [s.key, JSON.parse(s.value)])
        );
        
        // Set values or defaults in result
        settingKeys.forEach(key => {
          result[key] = settingsMap.has(key) ? settingsMap.get(key) : keys[key];
        });
      }
      
      // Special case handling for specific data structures
      
      // Handle 'userPrompts' with tags
      if (result.userPrompts === undefined && (typeof keys === 'string' && keys === 'userPrompts' || 
          Array.isArray(keys) && keys.includes('userPrompts') || 
          keys.userPrompts !== undefined)) {
        result.userPrompts = await getUserPrompts();
      }
      
      // Handle 'corePrompts' with tags
      if (result.corePrompts === undefined && (typeof keys === 'string' && keys === 'corePrompts' || 
          Array.isArray(keys) && keys.includes('corePrompts') || 
          keys.corePrompts !== undefined)) {
        result.corePrompts = await getCorePrompts();
      }
      
      // Handle 'favorites'
      if (result.favorites === undefined && (typeof keys === 'string' && keys === 'favorites' || 
          Array.isArray(keys) && keys.includes('favorites') || 
          keys.favorites !== undefined)) {
        result.favorites = await getFavorites();
      }
      
      // Handle 'recentlyUsed'
      if (result.recentlyUsed === undefined && (typeof keys === 'string' && keys === 'recentlyUsed' || 
          Array.isArray(keys) && keys.includes('recentlyUsed') || 
          keys.recentlyUsed !== undefined)) {
        result.recentlyUsed = await getRecentlyUsed();
      }
      
      // Handle 'userCategories'
      if (result.userCategories === undefined && (typeof keys === 'string' && keys === 'userCategories' || 
          Array.isArray(keys) && keys.includes('userCategories') || 
          keys.userCategories !== undefined)) {
        result.userCategories = await getUserCategories();
      }
      
      // Handle 'aiResponses'
      if (result.aiResponses === undefined && (typeof keys === 'string' && keys === 'aiResponses' || 
          Array.isArray(keys) && keys.includes('aiResponses') || 
          keys.aiResponses !== undefined)) {
        result.aiResponses = await getResponses();
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching data from database:', error);
      
      // Return defaults or null on error
      if (typeof keys === 'string') {
        result[keys] = null;
      } else if (Array.isArray(keys)) {
        keys.forEach(key => result[key] = null);
      } else {
        Object.keys(keys).forEach(key => result[key] = keys[key]);
      }
      
      return result;
    }
  },
  
  /**
   * Save data to the database
   * @param {Object} items - Key-value pairs to save
   * @returns {Promise<void>}
   */
  set: async (items) => {
    try {
      // Process each item to be stored
      const operations = Object.entries(items).map(async ([key, value]) => {
        // Special case handling for specific data structures
        if (key === 'userPrompts') {
          return storeUserPrompts(value);
        } else if (key === 'corePrompts') {
          return storeCorePrompts(value);
        } else if (key === 'favorites') {
          return storeFavorites(value);
        } else if (key === 'recentlyUsed') {
          return storeRecentlyUsed(value);
        } else if (key === 'userCategories') {
          return storeUserCategories(value);
        } else if (key === 'aiResponses') {
          return storeResponses(value);
        } else {
          // Store regular settings as JSON
          return prisma.setting.upsert({
            where: { key },
            update: { value: JSON.stringify(value) },
            create: { key, value: JSON.stringify(value) }
          });
        }
      });
      
      await Promise.all(operations);
    } catch (error) {
      console.error('Error saving data to database:', error);
      throw error;
    }
  },
  
  /**
   * Remove data from the database
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  remove: async (keys) => {
    try {
      const keysArray = typeof keys === 'string' ? [keys] : keys;
      
      const operations = keysArray.map(async (key) => {
        // Special case handling
        if (key === 'userPrompts') {
          return prisma.prompt.deleteMany({
            where: { isUserCreated: true }
          });
        } else if (key === 'corePrompts') {
          return prisma.prompt.deleteMany({
            where: { isUserCreated: false }
          });
        } else if (key === 'favorites') {
          return prisma.favorite.deleteMany({});
        } else if (key === 'recentlyUsed') {
          return prisma.recentlyUsed.deleteMany({});
        } else if (key === 'userCategories') {
          return prisma.category.deleteMany({
            where: { isUserCreated: true }
          });
        } else if (key === 'aiResponses') {
          return prisma.response.deleteMany({});
        } else {
          // Regular setting
          return prisma.setting.delete({
            where: { key }
          }).catch(() => {
            // Ignore if not found
            return null;
          });
        }
      });
      
      await Promise.all(operations);
    } catch (error) {
      console.error('Error removing data from database:', error);
      throw error;
    }
  },
  
  /**
   * Clear all data from the database
   * @returns {Promise<void>}
   */
  clear: async () => {
    try {
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
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  },
  
  // Helper functions for AI responses
  getResponses: async () => {
    return getResponses();
  },
  
  getResponsesForPrompt: async (promptId) => {
    try {
      const responses = await prisma.response.findMany({
        where: { promptId }
      });
      
      return responses.map(formatResponseFromDb);
    } catch (error) {
      console.error('Error fetching responses for prompt:', error);
      return [];
    }
  },
  
  saveResponse: async (response) => {
    try {
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
      
      return formatResponseFromDb(savedResponse);
    } catch (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  },
  
  deleteResponse: async (responseId) => {
    try {
      const result = await prisma.response.delete({
        where: { id: responseId }
      });
      
      return !!result;
    } catch (error) {
      console.error('Error deleting response:', error);
      return false;
    }
  },
  
  countResponsesForPrompt: async (promptId) => {
    try {
      return await prisma.response.count({
        where: { promptId }
      });
    } catch (error) {
      console.error('Error counting responses for prompt:', error);
      return 0;
    }
  }
};

// Helper function to get user prompts with tags
async function getUserPrompts() {
  try {
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
    
    return prompts.map(formatPromptFromDb);
  } catch (error) {
    console.error('Error fetching user prompts:', error);
    return [];
  }
}

// Helper function to get core prompts with tags
async function getCorePrompts() {
  try {
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
    
    return prompts.map(formatPromptFromDb);
  } catch (error) {
    console.error('Error fetching core prompts:', error);
    return [];
  }
}

// Helper function to get favorites
async function getFavorites() {
  try {
    const favorites = await prisma.favorite.findMany();
    return favorites.map(f => f.promptId);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}

// Helper function to get recently used
async function getRecentlyUsed() {
  try {
    const recentlyUsed = await prisma.recentlyUsed.findMany({
      orderBy: {
        usedAt: 'desc'
      }
    });
    
    return recentlyUsed.map(r => r.promptId);
  } catch (error) {
    console.error('Error fetching recently used:', error);
    return [];
  }
}

// Helper function to get user categories
async function getUserCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isUserCreated: true }
    });
    
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      isUserCreated: true
    }));
  } catch (error) {
    console.error('Error fetching user categories:', error);
    return [];
  }
}

// Helper function to get responses
async function getResponses() {
  try {
    const responses = await prisma.response.findMany();
    return responses.map(formatResponseFromDb);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return [];
  }
}

// Helper function to store user prompts
async function storeUserPrompts(prompts) {
  return storePrompts(prompts, true);
}

// Helper function to store core prompts
async function storeCorePrompts(prompts) {
  return storePrompts(prompts, false);
}

// Helper function to store prompts
async function storePrompts(prompts, isUserCreated) {
  try {
    // Delete existing prompts of this type
    await prisma.prompt.deleteMany({
      where: { isUserCreated }
    });
    
    // Create new prompts with their tags
    for (const prompt of prompts) {
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
    }
    
    return true;
  } catch (error) {
    console.error(`Error storing ${isUserCreated ? 'user' : 'core'} prompts:`, error);
    throw error;
  }
}

// Helper function to store favorites
async function storeFavorites(favorites) {
  try {
    // Delete existing favorites
    await prisma.favorite.deleteMany({});
    
    // Create new favorites
    for (const promptId of favorites) {
      // Check if prompt exists
      const promptExists = await prisma.prompt.findUnique({
        where: { id: promptId }
      });
      
      if (promptExists) {
        await prisma.favorite.create({
          data: { promptId }
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error storing favorites:', error);
    throw error;
  }
}

// Helper function to store recently used
async function storeRecentlyUsed(recentlyUsed) {
  try {
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
    
    return true;
  } catch (error) {
    console.error('Error storing recently used:', error);
    throw error;
  }
}

// Helper function to store user categories
async function storeUserCategories(categories) {
  try {
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
    
    return true;
  } catch (error) {
    console.error('Error storing user categories:', error);
    throw error;
  }
}

// Helper function to store responses
async function storeResponses(responses) {
  try {
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
    
    return true;
  } catch (error) {
    console.error('Error storing responses:', error);
    throw error;
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

export default storage;