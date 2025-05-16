import { formatPromptForDisplay } from './formatPromptDisplay.js';

/**
 * Imports prompts from a JSON file with duplicate detection
 * 
 * @param {File} file - The file object from the file input
 * @param {Function} onSuccess - Callback with the results of import
 * @param {Function} onError - Callback for any errors
 */
export function importPromptsWithDuplicateCheck(file, onSuccess, onError) {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const packData = JSON.parse(event.target.result);
      if (packData.type !== 'DJPromptsExport' || !Array.isArray(packData.prompts)) {
        throw new Error('Invalid file format');
      }
      
      // Get existing prompts to check for duplicates
      chrome.storage.local.get(['userPrompts', 'corePrompts'], function(result) {
        let userPrompts = result.userPrompts || [];
        const corePrompts = result.corePrompts || [];
        
        // Combine all existing prompts to check for duplicates
        const existingPrompts = [...userPrompts, ...corePrompts];
        
        // Track statistics
        let duplicateCount = 0;
        let newPrompts = [];
        
        // Process each imported prompt
        packData.prompts.forEach(importPrompt => {
          // Check if this prompt already exists based on title and content
          const isDuplicate = existingPrompts.some(existingPrompt => 
            existingPrompt.title?.toLowerCase() === importPrompt.title?.toLowerCase() && 
            existingPrompt.promptText?.toLowerCase() === importPrompt.promptText?.toLowerCase()
          );
          
          if (isDuplicate) {
            duplicateCount++;
          } else {
            // Format the prompt text for display and add to new prompts
            const newPrompt = {
              ...importPrompt,
              originalPromptText: importPrompt.promptText,
              promptText: formatPromptForDisplay(importPrompt.promptText),
              id: 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              isUserCreated: true
            };
            newPrompts.push(newPrompt);
          }
        });
        
        // Add only new prompts to storage
        if (newPrompts.length > 0) {
          const updatedUserPrompts = [...userPrompts, ...newPrompts];
          chrome.storage.local.set({ userPrompts: updatedUserPrompts }, function() {
            // Call success callback with results
            onSuccess({
              newPromptsCount: newPrompts.length,
              duplicateCount: duplicateCount,
              totalCount: packData.prompts.length
            });
          });
        } else {
          // All prompts were duplicates
          onSuccess({
            newPromptsCount: 0,
            duplicateCount: duplicateCount,
            totalCount: packData.prompts.length
          });
        }
      });
    } catch (error) {
      if (onError) onError(error);
    }
  };
  
  reader.onerror = function() {
    if (onError) onError(new Error('Error reading file'));
  };
  
  reader.readAsText(file);
} 