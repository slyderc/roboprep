import React, { useMemo, useState } from 'react';
import { usePrompts } from '../context/PromptContext';
import { PromptCard } from './PromptCard';
import { VariableModal } from './VariableModal';
import { NewPromptModal } from './NewPromptModal';
import { Button } from './ui/Button';

export function PromptList() {
  const { 
    userPrompts,
    corePrompts,
    favorites,
    recentlyUsed,
    activeCategory,
    categories
  } = usePrompts();
  
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState(null);
  
  // Get current category name
  const activeCategoryName = useMemo(() => {
    const category = categories.find(c => c.id === activeCategory);
    return category ? category.name : 'All Prompts';
  }, [categories, activeCategory]);
  
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
    return filteredPrompts.map(prompt => ({
      ...prompt,
      isFavorite: favorites.includes(prompt.id)
    }));
  }, [filteredPrompts, favorites]);
  
  const handleCopyPrompt = (prompt, onCopySuccess) => {
    setSelectedPrompt(prompt);
    setIsVariableModalOpen(true);
    
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
  
  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-800">{activeCategoryName}</h2>
        <span className="bg-gray-200 px-2 py-1 rounded-full font-medium count-indicator">
          {promptsWithStatus.length}
        </span>
      </div>
      
      {promptsWithStatus.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
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
        <div className="space-y-3">
          {promptsWithStatus.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onCopy={handleCopyPrompt}
              onEdit={handleEditPrompt}
            />
          ))}
        </div>
      )}
      
      {/* Variable Modal */}
      <VariableModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
        prompt={selectedPrompt}
        onCopyComplete={() => {
          if (selectedPrompt?.onCopySuccess) {
            selectedPrompt.onCopySuccess();
          }
          setSelectedPrompt(null);
          setIsVariableModalOpen(false);
        }}
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