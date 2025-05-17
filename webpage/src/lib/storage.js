/**
 * Storage wrapper that mimics the Chrome extension's storage API
 * Uses localStorage for client-side storage
 */
const storage = {
  get: async (keys) => {
    const result = {};
    if (typeof keys === 'string') {
      const value = localStorage.getItem(keys);
      result[keys] = value !== null ? JSON.parse(value) : null;
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        result[key] = value !== null ? JSON.parse(value) : null;
      });
    } else {
      Object.keys(keys).forEach(key => {
        const value = localStorage.getItem(key);
        result[key] = value !== null ? JSON.parse(value) : keys[key];
      });
    }
    return result;
  },
  
  set: async (items) => {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  },
  
  remove: async (keys) => {
    if (typeof keys === 'string') {
      localStorage.removeItem(keys);
    } else {
      keys.forEach(key => localStorage.removeItem(key));
    }
  },
  
  clear: async () => {
    localStorage.clear();
  },
  
  // Helper functions for AI responses
  getResponses: async () => {
    const result = await storage.get({ 'aiResponses': [] });
    return result.aiResponses;
  },
  
  getResponsesForPrompt: async (promptId) => {
    const responses = await storage.getResponses();
    return responses.filter(r => r.promptId === promptId);
  },
  
  saveResponse: async (response) => {
    const responses = await storage.getResponses();
    
    // Generate a unique ID if not provided
    if (!response.id) {
      response.id = `response_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    
    // Ensure creation timestamp
    if (!response.createdAt) {
      response.createdAt = new Date().toISOString();
    }
    
    const updatedResponses = [...responses, response];
    await storage.set({ 'aiResponses': updatedResponses });
    return response;
  },
  
  deleteResponse: async (responseId) => {
    const responses = await storage.getResponses();
    const updatedResponses = responses.filter(r => r.id !== responseId);
    
    if (updatedResponses.length < responses.length) {
      await storage.set({ 'aiResponses': updatedResponses });
      return true;
    }
    return false;
  },
  
  countResponsesForPrompt: async (promptId) => {
    const responses = await storage.getResponses();
    return responses.filter(r => r.promptId === promptId).length;
  }
};

export default storage;