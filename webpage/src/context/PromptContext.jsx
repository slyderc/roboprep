import { createContext, useContext, useState, useEffect } from 'react';
import storage from '../lib/storage';
import defaultPrompts from '../data/prompts.json';
import { sendPromptToOpenAI } from '../lib/apiClient';

// Define core categories
const CORE_CATEGORIES = [
  { id: 'artist-bio', name: 'Artist Bio' },
  { id: 'song-story', name: 'Song Story' },
  { id: 'show-segments', name: 'Show Segments' },
  { id: 'music-trivia', name: 'Music Trivia' },
  { id: 'interviews', name: 'Interviews' },
  { id: 'weather', name: 'Weather' },
  { id: 'features', name: 'Features' },
  { id: 'social-media', name: 'Social Media' },
];

const MAX_USER_CATEGORIES = 3;
const MAX_RECENT = 15;

// Create context
const PromptContext = createContext();

export function PromptProvider({ children }) {
  // State for prompts data
  const [userPrompts, setUserPrompts] = useState([]);
  const [corePrompts, setCorePrompts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [settings, setSettings] = useState({ fontSize: 'medium' });
  const [initialized, setInitialized] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  // New state for AI responses
  const [responses, setResponses] = useState([]);
  
  // Initialize storage
  useEffect(() => {
    async function initializeStorage() {
      
      try {
        // First, fetch main data from storage
        const data = await storage.get({
          'userPrompts': [],
          'corePrompts': defaultPrompts,
          'favorites': [],
          'recentlyUsed': [],
          'userCategories': [],
          'settings': { fontSize: 'medium' }
        });
        
        
        // Fetch responses separately
        const responseData = await storage.getResponses();
        
        // Check if we need to initialize the database
        if (data.corePrompts.length === 0 && Array.isArray(defaultPrompts) && defaultPrompts.length > 0) {
          
          // Trigger database initialization via API
          try {
            const initResponse = await fetch('/api/init');
            if (initResponse.ok) {
              
              // Fetch data again after initialization
              const refreshedData = await storage.get({
                'userPrompts': [],
                'corePrompts': defaultPrompts,
                'favorites': [],
                'recentlyUsed': [],
                'userCategories': [],
                'settings': { fontSize: 'medium' }
              });
              
              // Fetch responses separately
              const refreshedResponses = await storage.getResponses();
              
              
              // Use the refreshed data
              setUserPrompts(refreshedData.userPrompts);
              setCorePrompts(refreshedData.corePrompts.length > 0 ? refreshedData.corePrompts : defaultPrompts);
              setFavorites(Array.isArray(refreshedData.favorites) ? refreshedData.favorites : []);
              setRecentlyUsed(Array.isArray(refreshedData.recentlyUsed) ? refreshedData.recentlyUsed : []);
              setUserCategories(refreshedData.userCategories);
              setSettings(refreshedData.settings);
              setResponses(refreshedResponses);
              setInitialized(true);
              return;
            }
          } catch (initError) {
            console.error('Database initialization failed:', initError);
          }
        }
        
        // Use the fetched data
        setUserPrompts(data.userPrompts);
        setCorePrompts(data.corePrompts.length > 0 ? data.corePrompts : defaultPrompts);
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
        setRecentlyUsed(Array.isArray(data.recentlyUsed) ? data.recentlyUsed : []);
        setUserCategories(data.userCategories);
        setSettings(data.settings);
        setResponses(responseData);
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing storage:', error);
        
        // Fall back to defaults
        setUserPrompts([]);
        setCorePrompts(defaultPrompts);
        setFavorites([]);
        setRecentlyUsed([]);
        setUserCategories([]);
        setSettings({ fontSize: 'medium' });
        setResponses([]);
        setInitialized(true);
      }
    }
    
    initializeStorage();
  }, []);
  
  // Update categories when prompt data changes
  useEffect(() => {
    if (initialized) {
      updateCategories();
    }
  }, [initialized, userPrompts, corePrompts, favorites, recentlyUsed, userCategories]);
  
  // Calculate all categories with counts
  function updateCategories() {
    const allPrompts = [...corePrompts, ...userPrompts];
    
    // Combine core and user categories
    const staticCoreCategories = CORE_CATEGORIES;
    const allDefinedCategories = [...staticCoreCategories, ...userCategories];
    
    const newCategories = [
      { id: 'all', name: 'All Prompts', count: allPrompts.length },
      { id: 'recent', name: 'Recently Used', count: recentlyUsed.length },
      { id: 'favorites', name: 'Favorites', count: favorites.length },
      // Add combined core/user categories with counts
      ...allDefinedCategories.map(category => ({
        ...category,
        count: allPrompts.filter(p => p.category === category.id).length
      }))
    ];
    
    setCategories(newCategories);
  }
  
  // Core functions for prompt management
  async function addPrompt(prompt) {
    const newPrompt = {
      ...prompt,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      isUserCreated: true,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    
    const updatedPrompts = [...userPrompts, newPrompt];
    setUserPrompts(updatedPrompts);
    await storage.set({ 'userPrompts': updatedPrompts });
    return newPrompt;
  }
  
  async function updatePrompt(updatedPrompt) {
    let promptSaved = false;
    
    if (updatedPrompt.isUserCreated) {
      // Update in user prompts
      const updatedUserPrompts = userPrompts.map(p => 
        p.id === updatedPrompt.id ? {...updatedPrompt, lastEdited: new Date().toISOString()} : p
      );
      
      if (JSON.stringify(updatedUserPrompts) !== JSON.stringify(userPrompts)) {
        setUserPrompts(updatedUserPrompts);
        await storage.set({ 'userPrompts': updatedUserPrompts });
        promptSaved = true;
      }
    } else {
      // Update in core prompts
      const updatedCorePrompts = corePrompts.map(p => 
        p.id === updatedPrompt.id ? {...updatedPrompt, lastEdited: new Date().toISOString()} : p
      );
      
      if (JSON.stringify(updatedCorePrompts) !== JSON.stringify(corePrompts)) {
        setCorePrompts(updatedCorePrompts);
        await storage.set({ 'corePrompts': updatedCorePrompts });
        promptSaved = true;
      }
    }
    
    return promptSaved;
  }
  
  async function deletePrompt(promptId) {
    const initialLength = userPrompts.length;
    // Only delete from userPrompts (core prompts are not deletable)
    const updatedUserPrompts = userPrompts.filter(p => p.id !== promptId);
    
    // Also remove from favorites and recently used
    const updatedFavorites = favorites.filter(id => id !== promptId);
    const updatedRecentlyUsed = recentlyUsed.filter(id => id !== promptId);
    
    // Remove associated responses
    const updatedResponses = responses.filter(r => r.promptId !== promptId);
    
    if (updatedUserPrompts.length < initialLength) {
      setUserPrompts(updatedUserPrompts);
      setFavorites(updatedFavorites);
      setRecentlyUsed(updatedRecentlyUsed);
      setResponses(updatedResponses);
      
      await storage.set({ 
        userPrompts: updatedUserPrompts,
        favorites: updatedFavorites,
        recentlyUsed: updatedRecentlyUsed,
        aiResponses: updatedResponses
      });
      
      // Refresh data to update statistics and UI elements
      await refreshData();
      
      return true;
    }
    
    return false;
  }
  
  async function toggleFavorite(promptId) {
    try {
      // Make sure the prompt exists before toggling favorite
      const promptExists = await storage.promptExists(promptId);
      if (!promptExists) {
        console.error(`Cannot toggle favorite: Prompt with ID ${promptId} does not exist`);
        return false;
      }

      const updatedFavorites = favorites.includes(promptId)
        ? favorites.filter(id => id !== promptId)
        : [...favorites, promptId];
      
      // Update the local state
      setFavorites(updatedFavorites);
      
      // Persist to the database
      await storage.set({ favorites: updatedFavorites });
      
      console.log(`Favorites updated. Total: ${updatedFavorites.length}`);
      return updatedFavorites.includes(promptId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert the local state change if the database operation failed
      return favorites.includes(promptId);
    }
  }
  
  async function addToRecentlyUsed(promptId) {
    // Remove if already exists to move it to the front
    const filteredRecent = recentlyUsed.filter(id => id !== promptId);
    
    // Add to the front (most recent)
    const updatedRecentlyUsed = [promptId, ...filteredRecent];
    
    // Limit to a reasonable number
    const limitedRecentlyUsed = updatedRecentlyUsed.slice(0, MAX_RECENT);
    
    setRecentlyUsed(limitedRecentlyUsed);
    await storage.set({ recentlyUsed: limitedRecentlyUsed });
    
    // Increment usage count
    const allPrompts = [...corePrompts, ...userPrompts];
    const prompt = allPrompts.find(p => p.id === promptId);
    
    if (prompt) {
      const updatedPrompt = {
        ...prompt,
        usageCount: (prompt.usageCount || 0) + 1,
        lastUsed: new Date().toISOString()
      };
      
      await updatePrompt(updatedPrompt);
    }
  }
  
  // Category management functions
  async function addCategory(name) {
    if (userCategories.length >= MAX_USER_CATEGORIES) {
      throw new Error(`Maximum of ${MAX_USER_CATEGORIES} custom categories reached.`);
    }
    
    const combinedCategories = [...userCategories, ...CORE_CATEGORIES];
    if (combinedCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Category name already exists.');
    }
    
    const newCategory = {
      id: 'user_cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      isUserCreated: true
    };
    
    const updatedCategories = [...userCategories, newCategory];
    setUserCategories(updatedCategories);
    await storage.set({ userCategories: updatedCategories });
    
    return newCategory;
  }
  
  async function updateCategory(categoryId, newName) {
    const categoryIndex = userCategories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      throw new Error('Category not found.');
    }
    
    const currentName = userCategories[categoryIndex].name;
    
    // Check if new name conflicts with existing categories (excluding this one)
    const combinedOtherCategories = [
      ...userCategories.filter(cat => cat.id !== categoryId),
      ...CORE_CATEGORIES
    ];
    
    if (
      newName.toLowerCase() !== currentName.toLowerCase() &&
      combinedOtherCategories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())
    ) {
      throw new Error('Category name already exists.');
    }
    
    const updatedCategories = [...userCategories];
    updatedCategories[categoryIndex].name = newName;
    
    setUserCategories(updatedCategories);
    await storage.set({ userCategories: updatedCategories });
    
    return true;
  }
  
  async function deleteCategory(categoryId) {
    const updatedCategories = userCategories.filter(cat => cat.id !== categoryId);
    
    // Update prompts that used this category
    const updatePromptCategory = (prompt) => {
      if (prompt.category === categoryId) {
        const { category, ...rest } = prompt;
        return rest;
      }
      return prompt;
    };
    
    const updatedUserPrompts = userPrompts.map(updatePromptCategory);
    const updatedCorePrompts = corePrompts.map(updatePromptCategory);
    
    setUserCategories(updatedCategories);
    setUserPrompts(updatedUserPrompts);
    setCorePrompts(updatedCorePrompts);
    
    await storage.set({
      userCategories: updatedCategories,
      userPrompts: updatedUserPrompts,
      corePrompts: updatedCorePrompts
    });
    
    return true;
  }
  
  // Settings functions
  async function updateSettings(newSettings) {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await storage.set({ settings: updatedSettings });
    
    // If font size is updated, apply it to the document
    if (newSettings.fontSize && newSettings.fontSize !== settings.fontSize) {
      applyFontSize(newSettings.fontSize);
    }
    
    return updatedSettings;
  }
  
  // Helper to apply font size
  function applyFontSize(size) {
    const root = document.documentElement;
    
    // Remove existing size classes
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    
    // Add the new size class
    root.classList.add(`font-size-${size}`);
  }
  
  // Apply initial font size
  useEffect(() => {
    if (initialized) {
      applyFontSize(settings.fontSize || 'medium');
    }
  }, [initialized, settings.fontSize]);
  
  // AI response functions
  async function saveResponse(response) {
    // Make sure the response has a promptId
    if (!response.promptId) {
      throw new Error('Response must have a promptId');
    }
    
    // Prepare the response object with required fields
    const newResponse = {
      ...response,
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    };
    
    try {
      // Use the direct saveResponse API endpoint with the current user's ID
      const savedResponse = await storage.saveResponse(newResponse);
      
      // Update the local state
      const updatedResponses = [...responses, savedResponse];
      setResponses(updatedResponses);
      
      return savedResponse;
    } catch (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  }
  
  async function deleteResponse(responseId) {
    try {
      // Use the direct deleteResponse API endpoint
      const result = await storage.deleteResponse(responseId);
      
      if (result) {
        // Update the local state only after successful deletion
        const updatedResponses = responses.filter(r => r.id !== responseId);
        setResponses(updatedResponses);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting response:', error);
      return false;
    }
  }
  
  async function updateResponse(updatedResponse) {
    // Make sure we have an ID
    if (!updatedResponse.id) {
      throw new Error('Response must have an ID to update');
    }
    
    try {
      // Add lastEdited timestamp
      const responseToUpdate = {
        ...updatedResponse,
        lastEdited: new Date().toISOString()
      };
      
      // Save the updated response using the direct API
      const savedResponse = await storage.saveResponse(responseToUpdate);
      
      // Update the local state
      const updatedResponses = responses.map(r => 
        r.id === savedResponse.id ? savedResponse : r
      );
      
      setResponses(updatedResponses);
      
      return savedResponse;
    } catch (error) {
      console.error('Error updating response:', error);
      throw error;
    }
  }
  
  function getResponsesForPrompt(promptId) {
    return responses.filter(r => r.promptId === promptId);
  }
  
  function countResponsesForPrompt(promptId) {
    return getResponsesForPrompt(promptId).length;
  }
  
  async function submitPromptToAi(prompt, variables = {}) {
    try {
      // If prompt is an object, use its text and ID
      const promptText = typeof prompt === 'object' ? prompt.promptText : prompt;
      const promptId = typeof prompt === 'object' ? prompt.id : null;
      
      const result = await sendPromptToOpenAI(promptText, variables);
      
      // Add promptId to the response if available
      if (promptId) {
        result.promptId = promptId;
        result.variablesUsed = variables;
      }
      
      return result;
    } catch (error) {
      console.error('Error submitting prompt to AI:', error);
      throw error;
    }
  }
  
  // Function to refresh all data from the database
  async function refreshData() {
    try {
      console.log('Refreshing all data from database...');
      
      // Get main data
      const data = await storage.get({
        'userPrompts': [],
        'corePrompts': defaultPrompts,
        'favorites': [],
        'recentlyUsed': [],
        'userCategories': [],
        'settings': { fontSize: 'medium' }
      });
      
      // Get responses separately using direct method
      const responseData = await storage.getResponses();
      console.log(`Fetched ${responseData.length} responses from database`);
      
      // Get favorites directly using the dedicated method
      const favoritesData = await storage.getFavorites();
      
      // Update state with refreshed data
      setUserPrompts(data.userPrompts);
      setCorePrompts(data.corePrompts);
      setFavorites(favoritesData);
      setRecentlyUsed(Array.isArray(data.recentlyUsed) ? data.recentlyUsed : []);
      setUserCategories(data.userCategories);
      setSettings(data.settings);
      setResponses(responseData);
      
      return true;
    } catch (error) {
      console.error('Error refreshing data:', error);
      return false;
    }
  }

  // Return all context values
  const value = {
    // Data
    userPrompts,
    corePrompts,
    favorites,
    recentlyUsed,
    userCategories,
    settings,
    initialized,
    activeCategory,
    categories,
    CORE_CATEGORIES,
    MAX_USER_CATEGORIES,
    
    // Setters
    setActiveCategory,
    
    // Prompt functions
    addPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    addToRecentlyUsed,
    
    // Category functions
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Settings functions
    updateSettings,
    
    // AI response functions
    responses,
    saveResponse,
    deleteResponse,
    updateResponse,
    getResponsesForPrompt,
    countResponsesForPrompt,
    submitPromptToAi,
    
    // Data management
    refreshData,
    
    // Helper function
    allPrompts: [...corePrompts, ...userPrompts]
  };
  
  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
}

// Custom hook to use the prompt context
export function usePrompts() {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
}