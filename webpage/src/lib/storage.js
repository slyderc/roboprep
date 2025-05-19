/**
 * Database storage API for the RoboPrep application
 * Uses client-side API requests to handle database operations
 */
import { fetchWithErrorHandling } from './apiErrorHandler';

// Helper function to make API requests to the database endpoint
async function dbRequest(operation, params = {}) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operation, params }),
  };
  
  // Skip logging for performance reasons
  
  return fetchWithErrorHandling('/api/db', options, operation);
}

// Storage API implementation
const storage = {
  /**
   * Get data from the database
   * @param {string|string[]|Object} keys - Key(s) to retrieve or object with default values
   * @returns {Promise<Object>} Object with requested keys and their values
   */
  get: async (keys) => {
    try {
      // Process get request
      
      // Handle single string key
      if (typeof keys === 'string') {
        // Special handling for favorites
        if (keys === 'favorites') {
          const favorites = await dbRequest('getFavorites');
          return { favorites };
        }
        
        const data = await dbRequest('getSetting', { key: keys });
        return data;
      } 
      // Handle array of keys
      else if (Array.isArray(keys)) {
        // Check if favorites is in the keys
        if (keys.includes('favorites')) {
          const result = {};
          // Get favorites directly
          const favorites = await dbRequest('getFavorites');
          result.favorites = favorites;
          
          // Get remaining keys
          const otherKeys = keys.filter(k => k !== 'favorites');
          if (otherKeys.length > 0) {
            const otherData = await dbRequest('getSettings', { keys: otherKeys });
            Object.assign(result, otherData);
          }
          
          return result;
        }
        
        const data = await dbRequest('getSettings', { keys });
        return data;
      } 
      // Handle object with default values
      else {
        const settingKeys = Object.keys(keys);
        const result = {};
        
        // Special handling for favorites
        if (settingKeys.includes('favorites')) {
          const favorites = await dbRequest('getFavorites');
          result.favorites = favorites;
        }
        
        // Get the rest of the data
        const data = await dbRequest('getSettings', { keys });
        
        // Merge the results, preferring favorites we fetched explicitly
        return { ...data, ...result };
      }
    } catch (error) {
      console.error('Error fetching data from database:', error);
      
      // Return defaults or null on error
      const result = {};
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
          return dbRequest('storeUserPrompts', { prompts: value });
        } else if (key === 'corePrompts') {
          return dbRequest('storeCorePrompts', { prompts: value });
        } else if (key === 'favorites') {
          return dbRequest('storeFavorites', { favorites: value });
        } else if (key === 'recentlyUsed') {
          return dbRequest('storeRecentlyUsed', { recentlyUsed: value });
        } else if (key === 'userCategories') {
          return dbRequest('storeUserCategories', { categories: value });
        } else if (key === 'aiResponses') {
          return dbRequest('storeResponses', { responses: value });
        } else {
          // Store regular settings
          return dbRequest('setSetting', { key, value });
        }
      });
      
      await Promise.all(operations);
    } catch (error) {
      console.error('Error saving data to database:', error);
      throw error;
    }
  },
  
  /**
   * Add data to the database (without replacing existing data)
   * @param {Object} items - Key-value pairs to add
   * @returns {Promise<void>}
   */
  add: async (items) => {
    try {
      // Process each item to be added
      const operations = Object.entries(items).map(async ([key, value]) => {
        // Special case handling for specific data structures
        if (key === 'userPrompts') {
          return dbRequest('addUserPrompts', { prompts: value });
        } else if (key === 'userCategories') {
          return dbRequest('addUserCategories', { categories: value });
        } else if (key === 'aiResponses') {
          return dbRequest('addResponses', { responses: value });
        } else {
          // For other keys, use regular set operation
          return dbRequest('setSetting', { key, value });
        }
      });
      
      await Promise.all(operations);
    } catch (error) {
      console.error('Error adding data to database:', error);
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
          return dbRequest('storeUserPrompts', { prompts: [] });
        } else if (key === 'corePrompts') {
          return dbRequest('storeCorePrompts', { prompts: [] });
        } else if (key === 'favorites') {
          return dbRequest('storeFavorites', { favorites: [] });
        } else if (key === 'recentlyUsed') {
          return dbRequest('storeRecentlyUsed', { recentlyUsed: [] });
        } else if (key === 'userCategories') {
          return dbRequest('storeUserCategories', { categories: [] });
        } else if (key === 'aiResponses') {
          return dbRequest('storeResponses', { responses: [] });
        } else {
          // Regular setting
          return dbRequest('removeSetting', { key });
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
      await dbRequest('clearData');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  },
  
  /**
   * Check if a prompt exists
   * @param {string} promptId - Prompt ID to check
   * @returns {Promise<boolean>} Whether the prompt exists
   */
  promptExists: async (promptId) => {
    try {
      const result = await dbRequest('checkPromptExists', { promptId });
      return result.exists;
    } catch (error) {
      console.error('Error checking if prompt exists:', error);
      return false;
    }
  },
  
  // Helper functions for AI responses
  getResponses: async () => {
    try {
      return await dbRequest('getResponses');
    } catch (error) {
      console.error('Error fetching responses:', error);
      return [];
    }
  },
  
  getResponsesForPrompt: async (promptId) => {
    try {
      return await dbRequest('getResponsesForPrompt', { promptId });
    } catch (error) {
      console.error('Error fetching responses for prompt:', error);
      return [];
    }
  },
  
  saveResponse: async (response) => {
    try {
      return await dbRequest('saveResponse', { response });
    } catch (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  },
  
  deleteResponse: async (responseId) => {
    try {
      const result = await dbRequest('deleteResponse', { responseId });
      return result.success;
    } catch (error) {
      console.error('Error deleting response:', error);
      return false;
    }
  },
  
  countResponsesForPrompt: async (promptId) => {
    try {
      const result = await dbRequest('countResponsesForPrompt', { promptId });
      return result.count;
    } catch (error) {
      console.error('Error counting responses for prompt:', error);
      return 0;
    }
  },
  
  /**
   * Get favorites directly from the database
   * @returns {Promise<string[]>} Array of prompt IDs that are favorited
   */
  getFavorites: async () => {
    try {
      return await dbRequest('getFavorites');
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }
};

export default storage;