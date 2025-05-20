import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { usePrompts } from '../context/PromptContext';
import { PromptCard } from './PromptCard';
import { VariableModal } from './VariableModal';
import { NewPromptModal } from './NewPromptModal';
import { TagFilter } from './TagFilter';
import { Button, IconButton } from './ui/Button';

export function PromptList({ onSubmitToAi, onViewResponses }) {
  const { 
    userPrompts,
    corePrompts,
    favorites,
    recentlyUsed,
    activeCategory,
    categories,
    submitPromptToAi
  } = usePrompts();
  
  // Get all available tags from all prompts
  const allTags = useMemo(() => {
    const allPrompts = [...corePrompts, ...userPrompts];
    const tagSet = new Set();
    
    allPrompts.forEach(prompt => {
      if (prompt.tags && Array.isArray(prompt.tags)) {
        prompt.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [corePrompts, userPrompts]);
  
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState(null);
  const [submitToAiMode, setSubmitToAiMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Get current category name
  const activeCategoryName = useMemo(() => {
    const category = categories.find(c => c.id === activeCategory);
    return category ? category.name : 'All Prompts';
  }, [categories, activeCategory]);
  
  // Reset tag filters when changing categories
  useEffect(() => {
    setSelectedTags([]);
  }, [activeCategory]);
  
  // Filter prompts based on active category
  const filteredPrompts = useMemo(() => {
    const allPrompts = [...corePrompts, ...userPrompts];
    
    let result;
    if (activeCategory === 'all') {
      result = allPrompts;
    } else if (activeCategory === 'favorites') {
      result = allPrompts.filter(p => favorites.includes(p.id));
    } else if (activeCategory === 'recent') {
      // For recently used, maintain the order based on recentlyUsed array
      result = recentlyUsed
        .map(id => allPrompts.find(p => p.id === id))
        .filter(Boolean);
      
      // No additional sorting for recently used to preserve the usage order
      return result;
    } else {
      result = allPrompts.filter(p => p.category === activeCategory);
    }
    
    // Sort prompts by title, handling numeric prefixes and alphabetical order
    return result.sort((a, b) => {
      const titleA = a.title.replace(/^[^\w]*/, ''); // Remove emoji prefixes for sorting
      const titleB = b.title.replace(/^[^\w]*/, ''); // Remove emoji prefixes for sorting
      
      // Check if both titles start with numbers
      const numMatchA = titleA.match(/^(\d+)/);
      const numMatchB = titleB.match(/^(\d+)/);
      
      if (numMatchA && numMatchB) {
        // If both start with numbers, sort numerically first
        const numA = parseInt(numMatchA[1], 10);
        const numB = parseInt(numMatchB[1], 10);
        if (numA !== numB) {
          return numA - numB;
        }
      } else if (numMatchA) {
        // If only A starts with a number, it comes first
        return -1;
      } else if (numMatchB) {
        // If only B starts with a number, it comes first
        return 1;
      }
      
      // Otherwise, sort alphabetically
      return titleA.localeCompare(titleB);
    });
  }, [corePrompts, userPrompts, activeCategory, favorites, recentlyUsed]);
  
  // Add favorite status to prompts
  const promptsWithStatus = useMemo(() => {
    // First filter by category
    let prompts = filteredPrompts.map(prompt => ({
      ...prompt,
      isFavorite: favorites.includes(prompt.id)
    }));
    
    // Filter by selected tags if there are any selected
    if (selectedTags.length > 0) {
      prompts = prompts.filter(prompt => {
        // If the prompt has no tags, don't show it when tag filters are active
        if (!prompt.tags || !Array.isArray(prompt.tags) || prompt.tags.length === 0) {
          return false;
        }
        
        // Check if the prompt has ALL of the selected tags (AND logic)
        return selectedTags.every(selectedTag => prompt.tags.includes(selectedTag));
      });
    }
    
    return prompts;
  }, [filteredPrompts, favorites, selectedTags]);
  
  const handleCopyPrompt = (prompt, onCopySuccess) => {
    setSelectedPrompt(prompt);
    setIsVariableModalOpen(true);
    setSubmitToAiMode(false);
    
    // Store the callback so we can trigger it after copy completes
    if (onCopySuccess) {
      setSelectedPrompt({
        ...prompt,
        onCopySuccess
      });
    }
  };
  
  const handleEditPrompt = (prompt) => {
    setPromptToEdit(prompt);
    setIsEditModalOpen(true);
  };
  
  // New handlers for AI functionality
  const handleSubmitToAi = (prompt) => {
    const hasVariables = prompt.promptText && prompt.promptText.includes('{{');
    
    if (hasVariables) {
      // Open variable modal in AI mode
      setSelectedPrompt(prompt);
      setIsVariableModalOpen(true);
      setSubmitToAiMode(true);
    } else {
      // Submit directly to AI without variables
      if (onSubmitToAi) {
        onSubmitToAi(prompt);
      }
    }
  };
  
  const handleVariableSubmitToAi = (prompt, variables) => {
    if (onSubmitToAi) {
      onSubmitToAi(prompt, variables);
    }
  };
  
  const handleViewResponses = (prompt) => {
    if (onViewResponses) {
      onViewResponses(prompt);
    }
  };
  
  // Handle tag filter changes
  const handleTagFilterChange = useCallback((tags) => {
    setSelectedTags(tags);
  }, []);
  
  return (
    <div className="py-4 h-full">
      <div className="sticky top-0 bg-gray-50 pt-1 pb-3 z-[5] dark:bg-background-color prompt-list-header">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">{activeCategoryName}</h2>
          <div className="flex items-center gap-2">
            <IconButton
              title="New Prompt"
              onClick={() => setIsEditModalOpen(true)}
              variant="primary"
              className="bg-blue-300 text-blue-700 rounded-full p-1 hover:bg-blue-400 hover:text-blue-800 hover:shadow-md hover:scale-110 transition-all duration-200 dark:bg-blue-300 dark:text-blue-700 dark:hover:bg-blue-400 dark:hover:text-blue-800 shadow-sm transform"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
            />
            <span className="bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded-full font-medium count-indicator">
              {promptsWithStatus.length}
            </span>
          </div>
        </div>
        
        {/* Tag Filter - Only show if there are tags in the current category */}
        <TagFilter 
          prompts={filteredPrompts} 
          onFilterChange={handleTagFilterChange} 
        />
      </div>
      
      {promptsWithStatus.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white rounded-md shadow">
          <p className="text-lg mb-4">No prompts found in this category.</p>
          <Button
            variant="primary"
            onClick={() => {
              setPromptToEdit(null);
              setIsEditModalOpen(true);
            }}
          >
            Create New Prompt
          </Button>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto">
          {promptsWithStatus.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onCopy={handleCopyPrompt}
              onEdit={handleEditPrompt}
              onSubmitToAi={handleSubmitToAi}
              onViewResponses={handleViewResponses}
            />
          ))}
        </div>
      )}
      
      {/* Variable Modal */}
      <VariableModal
        isOpen={isVariableModalOpen}
        onClose={() => {
          setIsVariableModalOpen(false);
          setSubmitToAiMode(false);
          setSelectedPrompt(null);
        }}
        prompt={selectedPrompt}
        onCopyComplete={() => {
          if (selectedPrompt?.onCopySuccess) {
            selectedPrompt.onCopySuccess();
          }
          setSelectedPrompt(null);
          setIsVariableModalOpen(false);
        }}
        onSubmitToAi={handleVariableSubmitToAi}
      />
      
      {/* Edit Prompt Modal */}
      <NewPromptModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setPromptToEdit(null);
        }}
        promptToEdit={promptToEdit}
      />
    </div>
  );
}