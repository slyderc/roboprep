import React, { useMemo } from 'react';
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
      // Special categories first (if they exist)
      ...(allPrompts ? [allPrompts] : []),
      ...(recentlyUsed ? [recentlyUsed] : []),
      ...(favorites ? [favorites] : []),
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
          px-2 py-1.5 rounded-md cursor-pointer flex items-center justify-between category-item
          ${activeCategory === category.id 
            ? 'bg-blue-100 text-blue-700 font-semibold active-category' 
            : 'text-gray-700 hover:bg-gray-100'}
        `}
        onClick={() => setActiveCategory(category.id)}
      >
        <span className="text-category-name truncate mr-2 flex-grow">{category.name}</span>
        <span className="count-indicator">
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
      <h2 className="text-base font-medium text-gray-700 mb-3 px-1 category-heading">CATEGORIES</h2>
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
            <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded-full text-xs font-medium">
              Admin
            </span>
          )}
          <button
            onClick={handleLogout}
            className="inactive-tag theme-aware-tag filter-tag text-xs font-medium"
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