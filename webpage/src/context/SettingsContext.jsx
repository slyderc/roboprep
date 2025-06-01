import { createContext, useContext, useState, useEffect } from 'react';
import storage from '../lib/storage';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ 
    fontSize: 'medium',
    theme: 'light' // Default to light theme
  });
  const [initialized, setInitialized] = useState(false);
  
  // Load settings from storage on initial mount
  useEffect(() => {
    async function loadSettings() {
      const data = await storage.get({ 
        settings: { 
          fontSize: 'medium',
          theme: 'light' 
        } 
      });
      setSettings(data.settings);
      setInitialized(true);
      applyFontSize(data.settings.fontSize || 'medium');
      applyTheme(data.settings.theme || 'light');
    }
    
    loadSettings();
  }, []);
  
  // Apply font size to document
  function applyFontSize(size) {
    const root = document.documentElement;
    
    // Remove existing size classes
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    
    // Add the new size class
    root.classList.add(`font-size-${size}`);
  }
  
  // Apply theme to document
  function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  
  // Update settings
  async function updateSettings(newSettings) {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await storage.set({ settings: updatedSettings });
    
    // If font size is updated, apply it to the document
    if (newSettings.fontSize && newSettings.fontSize !== settings.fontSize) {
      applyFontSize(newSettings.fontSize);
    }
    
    // If theme is updated, apply it to the document
    if (newSettings.theme && newSettings.theme !== settings.theme) {
      applyTheme(newSettings.theme);
    }
    
    return updatedSettings;
  }
  
  const value = {
    settings,
    updateSettings,
    initialized
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}