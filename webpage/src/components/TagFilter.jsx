import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/Button';

/**
 * TagFilter component for filtering prompts by their tags
 * @param {Object} props - Component props
 * @param {Array} props.prompts - Array of prompt objects to extract tags from (for reference)
 * @param {Function} props.onFilterChange - Callback when filters change, receives array of selected tags
 * @returns {JSX.Element} The TagFilter component
 */
export function TagFilter({ prompts, onFilterChange }) {
  // Extract all unique tags from the current filtered prompts
  const allTags = useMemo(() => {
    if (!prompts || !prompts.length) return [];
    
    // Collect all tags
    const tagSet = new Set();
    prompts.forEach(prompt => {
      if (prompt.tags && Array.isArray(prompt.tags)) {
        prompt.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    // Convert to array and sort alphabetically
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [prompts]);
  
  // State for selected tags (all tags are selected by default)
  const [selectedTags, setSelectedTags] = useState(allTags);
  
  // Initialize with no tags selected
  useEffect(() => {
    setSelectedTags([]);
  }, [allTags]);
  
  // Call the onFilterChange callback whenever selectedTags changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(selectedTags);
    }
  }, [selectedTags, onFilterChange]);
  
  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  // Reset all tags (deselect all)
  const resetTags = () => {
    setSelectedTags([]);
  };
  
  // Don't render if there are no tags
  if (!allTags.length) return null;
  
  // Skip rendering if there's only one tag (not useful for filtering)
  if (allTags.length <= 1) return null;
  
  return (
    <div className="mb-3 bg-white p-3 rounded-md border border-gray-200 shadow-sm dark:bg-surface-color dark:border-border-color tag-filter-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-700 text-sm dark:text-text-color tag-filter-heading">
          FILTER BY TAGS
        </div>
        <Button
          variant="secondary"
          className={`text-xs py-0.5 px-2 reset-button dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600 transition-opacity duration-200 ${selectedTags.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={resetTags}
          title="Reset filters"
        >
          Reset
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-1.5 mb-2 tag-container">
        {allTags.map(tag => (
          <span
            key={tag}
            onClick={() => toggleTag(tag)}
            className={selectedTags.includes(tag)
              ? "bg-blue-100 text-blue-800 rounded-full text-prompt-tag theme-aware-tag hover:bg-blue-200" // Active filter - exactly like prompt card tag
              : "inactive-tag rounded-full text-prompt-tag theme-aware-tag hover:bg-gray-400 filter-tag" // Inactive filter with consistent hover behavior
            }
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}