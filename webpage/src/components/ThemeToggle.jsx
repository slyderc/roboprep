import React from 'react';
import { useSettings } from '../context/SettingsContext';

export function ThemeToggle() {
  const { settings, updateSettings } = useSettings();
  const isDarkMode = settings.theme === 'dark';
  
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };
  
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 focus:outline-none"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <span className="text-xl" role="img" aria-label="Light mode">☀️</span>
      ) : (
        <span className="text-xl" role="img" aria-label="Dark mode">🌙</span>
      )}
    </button>
  );
}