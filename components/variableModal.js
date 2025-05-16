// components/variableModal.js
// This file exports functions to handle variable detection and replacement

/**
 * Detects variables in a prompt text
 * @param {string} promptText - The prompt text to analyze
 * @returns {string[]} Array of variable names found
 */
export function detectVariables(promptText) {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = regex.exec(promptText)) !== null) {
      variables.push(match[1]);
    }
    
    return [...new Set(variables)]; // Remove duplicates
  }
  
  /**
   * Replaces variables in a prompt text with their values
   * @param {string} promptText - The prompt text with variables
   * @param {Object} replacements - Key-value pairs of variable names and their replacements
   * @returns {string} The prompt text with variables replaced
   */
  export function replaceVariables(promptText, replacements) {
    let result = promptText;
    Object.entries(replacements).forEach(([variable, value]) => {
      result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });
    return result;
  }
  
  /**
   * Creates a variable replacement modal
   * @param {Object} prompt - The prompt object
   * @param {string[]} variables - Array of variable names
   * @param {Function} onCancel - Function to call when canceled
   * @param {Function} onSubmit - Function to call when submitted with replacements
   * @returns {HTMLElement} The modal element
   */
  export function createVariableModal(prompt, variables, onCancel, onSubmit) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div class="p-3 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-medium">Replace Variables & Copy</h2>
          <button id="closeVarModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="p-4">
          <p class="text-sm text-gray-600 mb-4">
            Please insert the replacement text for the variables within the selected prompt.
          </p>
          
          <div id="variableFields" class="space-y-4 max-h-64 overflow-y-auto">
            ${variables.map(variable => `
              <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-700">Enter: ${variable.replace(/[_-]/g, ' ')}</label>
                <input
                  type="text"
                  id="var-${variable}"
                  placeholder="e.g., ${getPlaceholderExample(variable)}"
                  class="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            `).join('')}
          </div>
          
          <div class="flex justify-end gap-2 mt-6">
            <button id="cancelVarBtn" class="px-3 py-1.5 text-sm text-gray-600 rounded-md border border-gray-300">
              Cancel
            </button>
            <button id="previewVarBtn" class="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-md border border-gray-300">
              Preview
            </button>
            <button id="copyVarBtn" class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md flex items-center">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    modal.querySelector('#closeVarModal').addEventListener('click', onCancel);
    modal.querySelector('#cancelVarBtn').addEventListener('click', onCancel);
    
    modal.querySelector('#previewVarBtn').addEventListener('click', () => {
      const replacements = {};
      variables.forEach(variable => {
        replacements[variable] = modal.querySelector(`#var-${variable}`).value || `{{${variable}}}`;
      });
      
      const previewText = replaceVariables(prompt.promptText, replacements);
      alert(previewText); // Simple preview for now
    });
    
    modal.querySelector('#copyVarBtn').addEventListener('click', () => {
      const replacements = {};
      variables.forEach(variable => {
        replacements[variable] = modal.querySelector(`#var-${variable}`).value || `{{${variable}}}`;
      });
      
      onSubmit(replacements);
    });
    
    return modal;
  }
  
  /**
   * Gets a placeholder example based on variable name
   * @param {string} variable - The variable name
   * @returns {string} An example value for the variable
   */
  function getPlaceholderExample(variable) {
    // Return contextual examples based on variable name
    const examples = {
      'artist_name': 'The Rolling Stones',
      'song_title': 'Paint It Black',
      'album_name': 'Aftermath',
      'release_year': '1966',
      'genre': 'Rock',
      'weather': 'sunny with a high of 75°F',
      'guest_name': 'John Smith',
      'station_call': 'WXYZ',
      'show_name': 'Morning Drive'
    };
    
    // Look for matches in the variable name
    for (const key in examples) {
      if (variable.includes(key) || key.includes(variable)) {
        return examples[key];
      }
    }
    
    // Default examples by common variable types
    if (variable.includes('name')) return 'John Smith';
    if (variable.includes('year')) return '2023';
    if (variable.includes('date')) return 'January 1st';
    if (variable.includes('time')) return '3:30 PM';
    if (variable.includes('location')) return 'Downtown';
    
    return 'your text here';
  }