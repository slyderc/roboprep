// components/promptDisplay.js
// Helper functions for displaying formatted prompts in the library

import { formatPromptForDisplay } from './formatPromptDisplay.js';

/**
 * Creates a formatted text display element for a prompt
 * 
 * @param {string} promptText - The prompt text to display
 * @param {Object} options - Display options
 * @returns {HTMLElement} The formatted display element
 */
export function createPromptDisplay(promptText, options = {}) {
  const {
    maxHeight = '200px',
    className = 'bg-gray-50 p-3 rounded-md text-sm font-mono overflow-auto',
    lineHeight = '1.5'
  } = options;
  
  // Create container element
  const container = document.createElement('div');
  container.className = className;
  container.style.maxHeight = maxHeight;
  container.style.lineHeight = lineHeight;
  container.style.whiteSpace = 'pre-wrap';
  
  // Format the prompt text
  const formattedText = formatPromptForDisplay(promptText);
  
  // Set the text content
  container.textContent = formattedText;
  
  return container;
}

/**
 * Updates the prompt text in the display container
 * 
 * @param {HTMLElement} container - The display container to update
 * @param {string} promptText - The new prompt text
 */
export function updatePromptDisplay(container, promptText) {
  if (!container) return;
  
  // Format the prompt text
  const formattedText = formatPromptForDisplay(promptText);
  
  // Update the container
  container.textContent = formattedText;
}

/**
 * Helper function to render a prompt from JSON directly to an element
 * 
 * @param {string} jsonString - The JSON string containing the prompt
 * @param {string} targetElementId - The ID of the element to update
 * @returns {boolean} Success status
 */
export function renderPromptToElement(jsonString, targetElementId) {
  try {
    // Try to parse JSON first
    const data = JSON.parse(jsonString);
    
    // Get the prompt text
    const promptText = data.promptText || '';
    
    // Format and update the display
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) {
      const formattedText = formatPromptForDisplay(promptText);
      targetElement.textContent = formattedText;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error rendering prompt:', error);
    return false;
  }
} 