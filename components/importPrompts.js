// components/importPrompts.js
// This file implements JSON prompt importing functionality

import { processImportedPrompts, cleanPromptText } from './promptParser.js';

/**
 * Handles the import of prompts from a JSON file
 * @param {File} file - The file object from a file input
 * @returns {Promise<Array>} Promise resolving to array of imported prompts
 */
export function importPromptsFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        const fileContent = event.target.result;
        const importedPrompts = processImportedPrompts(fileContent);
        resolve(importedPrompts);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = function() {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Creates an import button for the UI
 * @param {Function} onImportComplete - Callback when import is complete with prompt array
 * @returns {HTMLElement} The created button
 */
export function createImportButton(onImportComplete) {
  const importContainer = document.createElement('div');
  importContainer.className = 'flex items-center';
  
  importContainer.innerHTML = `
    <label for="import-json" class="cursor-pointer p-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 flex items-center">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      Import Prompts
    </label>
    <input id="import-json" type="file" accept=".json" class="hidden" />
  `;
  
  const fileInput = importContainer.querySelector('#import-json');
  fileInput.addEventListener('change', async (event) => {
    if (event.target.files.length > 0) {
      try {
        const file = event.target.files[0];
        const importedPrompts = await importPromptsFromJson(file);
        
        if (importedPrompts.length > 0) {
          onImportComplete(importedPrompts);
          // Reset file input to allow re-importing the same file
          fileInput.value = '';
        } else {
          alert('No valid prompts found in the imported file.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing prompts: ' + error.message);
      }
    }
  });
  
  return importContainer;
}

/**
 * Sample implementation showing how to use the import feature
 */
export function setupImportFeature() {
  // Sample storage function to save prompts
  const saveImportedPrompts = (prompts) => {
    chrome.storage.local.get(['userPrompts'], function(result) {
      const existingPrompts = result.userPrompts || [];
      const updatedPrompts = [...existingPrompts, ...prompts];
      
      chrome.storage.local.set({ userPrompts: updatedPrompts }, function() {
        console.log('Imported prompts saved:', prompts.length);
      });
    });
  };

  // Create and add import button to a container element
  const importButton = createImportButton((importedPrompts) => {
    // Process and save the imported prompts
    saveImportedPrompts(importedPrompts);
    
    // Show success message
    const count = importedPrompts.length;
    alert(`Successfully imported ${count} prompt${count === 1 ? '' : 's'}.`);
    
    // Refresh the UI (assuming this function exists elsewhere)
    if (typeof refreshPromptsList === 'function') {
      refreshPromptsList();
    }
  });
  
  // Add the import button to the page (example)
  const targetContainer = document.querySelector('#importButtonContainer');
  if (targetContainer) {
    targetContainer.appendChild(importButton);
  }
}

// Example of direct use of the parser for a single JSON string
export function parseAndUsePrompt(jsonString) {
  const importedPrompts = processImportedPrompts(jsonString);
  
  if (importedPrompts.length > 0) {
    const prompt = importedPrompts[0];
    
    // Get clean text ready for use in the UI
    const cleanText = cleanPromptText(prompt.promptText);
    
    // Now you can use cleanText directly in the UI or pass to another component
    return cleanText;
  }
  
  return null;
} 