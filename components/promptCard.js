// components/promptCard.js
// This file exports a function to create prompt card elements

/**
 * Creates a prompt card element
 * @param {Object} prompt - The prompt object
 * @param {Function} onCopy - Function to call when copy button is clicked
 * @param {Function} onFavorite - Function to call when favorite button is clicked
 * @param {Function} onEdit - Function to call when edit button is clicked
 * @returns {HTMLElement} The created card element
 */
export function createPromptCard(prompt, onCopy, onFavorite, onEdit) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-md border border-gray-200 p-3 hover:shadow-sm';
    
    const tags = prompt.tags || [];
    const tagsHtml = tags.map(tag => 
      `<span class="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">${tag}</span>`
    ).join('');
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-medium text-sm">${prompt.title}</h3>
        ${prompt.isFavorite ? '<div class="bg-yellow-400 h-3 w-3 rounded-full"></div>' : ''}
      </div>
      <p class="text-xs text-gray-600 mb-2">${prompt.description}</p>
      <div class="flex flex-wrap gap-1 mb-2">
        ${tagsHtml}
      </div>
      <div class="flex justify-end gap-1">
        <button class="p-1 text-gray-400 hover:text-gray-700 favorite-btn">
          <svg class="w-3.5 h-3.5" fill="${prompt.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        </button>
        <button class="p-1 text-gray-400 hover:text-blue-600 copy-btn">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
        <button class="p-1 text-gray-400 hover:text-gray-700 edit-btn">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
      </div>
    `;
    
    // Add event listeners
    card.querySelector('.copy-btn').addEventListener('click', () => onCopy(prompt));
    card.querySelector('.favorite-btn').addEventListener('click', () => onFavorite(prompt.id));
    card.querySelector('.edit-btn').addEventListener('click', () => onEdit(prompt));
    
    return card;
  }