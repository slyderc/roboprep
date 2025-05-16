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
  }
};

export default storage;