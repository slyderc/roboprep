// components/enhancedPromptCard.js
// Enhanced version of promptCard with proper prompt formatting

import { formatPromptForDisplay } from './formatPromptDisplay.js';

/**
 * Creates an enhanced prompt card with properly formatted prompt preview
 * @param {Object} prompt - The prompt object
 * @param {Function} onCopy - Function to call when copy button is clicked
 * @param {Function} onFavorite - Function to call when favorite button is clicked
 * @param {Function} onEdit - Function to call when edit button is clicked
 * @param {Function} onPreview - Function to call when preview button is clicked (optional)
 * @returns {HTMLElement} The created card element
 */
export function createEnhancedPromptCard(prompt, onCopy, onFavorite, onEdit, onPreview) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-md border border-gray-200 p-3 hover:shadow-sm';
  
  const tags = prompt.tags || [];
  const tagsHtml = tags.map(tag => 
    `<span class="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">${tag}</span>`
  ).join('');
  
  // Create a shortened preview of the formatted prompt text
  const formattedPromptText = formatPromptForDisplay(prompt.promptText || '');
  const previewText = formattedPromptText.substring(0, 100) + (formattedPromptText.length > 100 ? '...' : '');
  
  card.innerHTML = `
    <div class="flex justify-between items-start mb-1">
      <h3 class="font-medium text-sm">${prompt.title}</h3>
      ${prompt.isFavorite ? '<div class="bg-yellow-400 h-3 w-3 rounded-full"></div>' : ''}
    </div>
    <p class="text-xs text-gray-600 mb-2">${prompt.description}</p>
    <div class="flex flex-wrap gap-1 mb-2">
      ${tagsHtml}
    </div>
    
    <div class="text-xs bg-gray-50 p-2 rounded mb-2 whitespace-pre-wrap" style="max-height: 80px; overflow-y: auto; line-height: 1.4;">
      ${previewText.replace(/\n/g, '<br>')}
    </div>
    
    <div class="flex justify-end gap-1">
      <button class="p-1 text-gray-400 hover:text-indigo-600 preview-btn" title="Preview">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
      </button>
      <button class="p-1 text-gray-400 hover:text-gray-700 favorite-btn" title="Favorite">
        <svg class="w-3.5 h-3.5" fill="${prompt.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
        </svg>
      </button>
      <button class="p-1 text-gray-400 hover:text-blue-600 copy-btn" title="Copy">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
      <button class="p-1 text-gray-400 hover:text-gray-700 edit-btn" title="Edit">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add event listeners
  card.querySelector('.copy-btn').addEventListener('click', () => {
    // Before copying, make sure we're using the properly formatted text
    const formattedPrompt = { ...prompt };
    formattedPrompt.promptText = formatPromptForDisplay(prompt.promptText || '');
    onCopy(formattedPrompt);
  });
  
  card.querySelector('.favorite-btn').addEventListener('click', () => onFavorite(prompt.id));
  card.querySelector('.edit-btn').addEventListener('click', () => onEdit(prompt));
  
  // Add preview button event handler if provided
  const previewBtn = card.querySelector('.preview-btn');
  if (previewBtn) {
    if (onPreview) {
      previewBtn.addEventListener('click', () => onPreview(prompt));
    } else {
      // Default preview handler
      previewBtn.addEventListener('click', () => {
        showPromptPreview(prompt);
      });
    }
  }
  
  return card;
}

/**
 * Shows a preview modal with the formatted prompt
 * @param {Object} prompt - The prompt object
 */
function showPromptPreview(prompt) {
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
  // Format the prompt text
  const formattedText = formatPromptForDisplay(prompt.promptText || '');
  
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div class="p-3 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-lg font-medium">${prompt.title || 'Prompt Preview'}</h2>
        <button id="closePreviewModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="p-4 overflow-y-auto flex-grow">
        <div class="whitespace-pre-wrap bg-gray-50 p-4 rounded font-mono text-sm">
          ${formattedText.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div class="p-3 border-t border-gray-200 flex justify-end">
        <button id="copyPreviewPrompt" class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md flex items-center">
          <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          Copy to Clipboard
        </button>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('#closePreviewModal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#copyPreviewPrompt').addEventListener('click', () => {
    navigator.clipboard.writeText(formattedText).then(() => {
      const copyBtn = modal.querySelector('#copyPreviewPrompt');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    });
  });
  
  // Close on click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
} 