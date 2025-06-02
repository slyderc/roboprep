import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePrompts } from '../context/PromptContext';
import { useAuth } from '../context/AuthContext';

export function CategoryList() {
  const { categories, activeCategory, setActiveCategory } = usePrompts();
  const { user, logout } = useAuth();
  
  // Sort and organize categories
  const organizedCategories = useMemo(() => {
    if (!categories || !categories.length) return [];
    
    // Extract special categories (first 3)
    const allPrompts = categories.find(c => c.id === 'all');
    const recentlyUsed = categories.find(c => c.id === 'recent');
    const favorites = categories.find(c => c.id === 'favorites');
    
    // Get remaining categories
    const remainingCategories = categories.filter(c => 
      !['all', 'recent', 'favorites'].includes(c.id)
    );
    
    // Sort remaining categories: numeric first (in order), then alphabetically
    const sortedCategories = [...remainingCategories].sort((a, b) => {
      // Check if name starts with number
      const aStartsWithNum = /^\d/.test(a.name);
      const bStartsWithNum = /^\d/.test(b.name);
      
      // If both start with number, sort numerically
      if (aStartsWithNum && bStartsWithNum) {
        const aNum = parseInt(a.name.match(/^\d+/)[0]);
        const bNum = parseInt(b.name.match(/^\d+/)[0]);
        return aNum - bNum;
      }
      
      // If only a starts with number, a comes first
      if (aStartsWithNum) return -1;
      
      // If only b starts with number, b comes first
      if (bStartsWithNum) return 1;
      
      // Otherwise, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    // Return organized array
    return [
      // Special categories first (if they exist) - reordered: Favorites, Recently Used, All Prompts
      ...(favorites ? [favorites] : []),
      ...(recentlyUsed ? [recentlyUsed] : []),
      ...(allPrompts ? [allPrompts] : []),
      // Then the sorted remaining categories
      ...(sortedCategories.length > 0 ? ['separator'] : []), // Add separator if we have categories
      ...sortedCategories
    ];
  }, [categories]);
  
  // Render category item
  const renderCategory = (category) => {
    // If this is the separator
    if (category === 'separator') {
      return <hr key="separator" className="my-2 border-gray-200 dark:border-gray-700" />;
    }
    
    // Otherwise render the category
    return (
      <div
        key={category.id}
        className={`
          px-2 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors
          ${activeCategory === category.id 
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
        `}
        onClick={() => setActiveCategory(category.id)}
      >
        <span className="truncate mr-2 flex-grow text-sm leading-tight tracking-tight flex items-center max-w-[calc(100%-1.75rem)]">
          {category.id === 'favorites' && (
            <svg 
              className="w-4 h-4 mr-1.5 text-yellow-500 dark:text-yellow-400" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
          {category.id === 'recent' && (
            <svg 
              className="w-4 h-4 mr-1.5 text-green-500 dark:text-green-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          )}
          {category.name}
        </span>
        <span className="min-w-6 h-5 text-center text-xs leading-none py-0.5 px-1.5 rounded-full inline-flex items-center justify-center font-medium transition-colors bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:border dark:border-gray-500">
          {category.count}
        </span>
      </div>
    );
  };
  
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="py-3 px-1 categories-panel">
      <h2 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3 px-1 category-heading">CATEGORIES</h2>
      <div className="category-list">
        {organizedCategories.map(category => renderCategory(category))}
      </div>
      
      {/* User info and logout section */}
      <div className="mt-8 px-2 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
          {user?.firstName || 'Guest'}
        </div>
        <div className="flex justify-between items-center">
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors cursor-pointer"
            >
              Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs px-1.5 py-0.5 inline-flex items-center justify-center min-h-5 leading-tight cursor-pointer transition-colors hover:bg-gray-400 hover:text-gray-800 dark:hover:bg-gray-500 dark:hover:text-gray-200 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
      {/* Remove any potential decorative elements */}
      <style jsx>{`
        /* Ensure there are no decorative pseudo-elements */
        div::after, div::before {
          display: none;
        }
      `}</style>
    </div>
  );
}