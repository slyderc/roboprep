import { createContext, useContext, useState, useEffect } from 'react';
import storage from '../lib/storage';
import defaultPrompts from '../data/prompts.json';

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
  
  // Initialize storage
  useEffect(() => {
    async function initializeStorage() {
      const data = await storage.get({
        'userPrompts': [],
        'corePrompts': defaultPrompts,
        'favorites': [],
        'recentlyUsed': [],
        'userCategories': [],
        'settings': { fontSize: 'medium' }
      });
      
      setUserPrompts(data.userPrompts);
      setCorePrompts(data.corePrompts);
      setFavorites(data.favorites);
      setRecentlyUsed(data.recentlyUsed);
      setUserCategories(data.userCategories);
      setSettings(data.settings);
      setInitialized(true);
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
    
    if (updatedUserPrompts.length < initialLength) {
      setUserPrompts(updatedUserPrompts);
      setFavorites(updatedFavorites);
      setRecentlyUsed(updatedRecentlyUsed);
      
      await storage.set({ 
        userPrompts: updatedUserPrompts,
        favorites: updatedFavorites,
        recentlyUsed: updatedRecentlyUsed
      });
      
      return true;
    }
    
    return false;
  }
  
  async function toggleFavorite(promptId) {
    const updatedFavorites = favorites.includes(promptId)
      ? favorites.filter(id => id !== promptId)
      : [...favorites, promptId];
    
    setFavorites(updatedFavorites);
    await storage.set({ favorites: updatedFavorites });
    
    return updatedFavorites.includes(promptId);
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