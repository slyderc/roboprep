// Import the formatting utility
import { formatPromptForDisplay } from '../components/formatPromptDisplay.js';
import { importPromptsWithDuplicateCheck } from '../components/importPromptsWithDuplicateCheck.js';

console.log('sidebar.js script execution started.'); // Top-level check

// --- Constants (Copied from popup.js) ---
const MAX_USER_CATEGORIES = 3;

// --- Constants ---
const CORE_CATEGORIES = [ // Define core categories (should match popup.js)
    { id: 'artist-bio', name: 'Artist Bio' },
    { id: 'song-story', name: 'Song Story' },
    { id: 'show-segments', name: 'Show Segments' },
    { id: 'music-trivia', name: 'Music Trivia' },
    { id: 'interviews', name: 'Interviews' },
    { id: 'weather', name: 'Weather' },
    { id: 'features', name: 'Features' },
    { id: 'social-media', name: 'Social Media' },
];

document.addEventListener('DOMContentLoaded', function() {
  // Load categories
  loadCategories();

  // Load prompts (initial load for 'all')
  loadPrompts();

  // Set up event listeners for static elements
  const openFloatingBtn = document.getElementById('openFloatingBtn');
  if (openFloatingBtn) {
    openFloatingBtn.addEventListener('click', openFloatingWindow);
  }

  // Add listener for header new prompt button
  const headerNewPromptBtn = document.getElementById('headerNewPromptBtnSidebar');
  if (headerNewPromptBtn) {
    headerNewPromptBtn.addEventListener('click', () => showNewPromptModal());
  }

  const newPromptBtn = document.getElementById('newPromptBtn');
  if (newPromptBtn) {
    newPromptBtn.addEventListener('click', () => showNewPromptModal()); // Pass no ID for new
  }

  // Initialize the UI components like default prompts
  initializeComponents();

  // Add settings button (if applicable in sidebar context)
  // --- Settings Button Logic ---
  const settingsBtnContainer = document.querySelector('header .flex.items-center.gap-1'); // Adjust selector if needed
  if (settingsBtnContainer && !document.getElementById('settingsBtn')) {
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settingsBtn';
    settingsBtn.title = "Settings";
    // Adjusted padding/icon size for sidebar
    settingsBtn.className = 'p-1 text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500';
    settingsBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    `;
    // Insert settings button before the "New Prompt" button
    const newPromptBtnRef = document.getElementById('newPromptBtn');
    if(newPromptBtnRef) {
      settingsBtnContainer.insertBefore(settingsBtn, newPromptBtnRef);
    } else {
      settingsBtnContainer.appendChild(settingsBtn); // Fallback append
    }
  }
  
  // Ensure listener is attached (handles creation and hot reload)
  const settingsButton = document.getElementById('settingsBtn');
  if (settingsButton) {
      settingsButton.removeEventListener('click', openSettings); // Prevent duplicates
      settingsButton.addEventListener('click', openSettings);
  }
  
  // Apply initial font size from settings
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || { fontSize: 'medium' };
    applyFontSize(settings.fontSize || 'medium');
  });

  // Add listener for Upgrade button
  const upgradeButton = document.getElementById('upgradeBtnSidebar');
  if (upgradeButton) {
    upgradeButton.addEventListener('click', showUpgradeModalSidebar);
  }
});

function openFloatingWindow() {
  chrome.runtime.sendMessage({ action: "openFloatingWindow" })
    .catch(error => {
      console.debug("Message sending failed:", error);
    });
  setTimeout(() => { window.close(); }, 50);
}

// --- Category Loading & Rendering (Sidebar Dropdown) ---
function loadCategories() {
  chrome.storage.local.get(['corePrompts', 'userPrompts', 'favorites', 'recentlyUsed', 'userCategories'], function(result) {
    const allPrompts = [...(result.corePrompts || []), ...(result.userPrompts || [])];
    const favorites = result.favorites || [];
    const recentlyUsed = result.recentlyUsed || [];
    const userCategories = result.userCategories || [];

    // Combine core and user categories 
    const staticCoreCategories = CORE_CATEGORIES; // Use constant
    const allDefinedCategories = [...staticCoreCategories, ...userCategories];

    // Base categories structure for the dropdown
    let categories = [
        { id: 'all', name: 'All Prompts', count: allPrompts.length },
        { id: 'recent', name: 'Recently Used', count: recentlyUsed.length },
        { id: 'favorites', name: 'Favorites', count: favorites.length },
        // Add combined core/user categories with counts
        ...allDefinedCategories.map(category => ({
            ...category,
            count: allPrompts.filter(p => p.category === category.id).length
        })).sort((a, b) => a.name.localeCompare(b.name)) // Sort alpha
    ];

    renderCategories(categories);
  });
}

function renderCategories(categories) {
  const categoriesListContainer = document.getElementById('categoriesList'); // Container div
  if (!categoriesListContainer) return;

  // Filter out categories with 0 prompts, except for special ones
  // REMOVED Filter: We want to show all defined categories now.
  // const displayCategories = categories.filter(cat => 
  //     cat.count > 0 || ['all', 'recent', 'favorites'].includes(cat.id)
  // );
  const displayCategories = categories; // Use all categories passed in

  categoriesListContainer.innerHTML = `
    <select id="categoryDropdown" class="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
      ${displayCategories.map(category => `
        <option value="${category.id}">${category.name} (${category.count})</option>
      `).join('')}
    </select>
  `;

  const dropdown = document.getElementById('categoryDropdown');
  if (dropdown) {
    dropdown.addEventListener('change', function() {
      loadPrompts(this.value);
    });

    // Select "All Prompts" by default if it exists
    if (dropdown.options.length > 0 && displayCategories.some(cat => cat.id === 'all')) {
      dropdown.value = 'all';
    } else if (dropdown.options.length > 0) {
      // Fallback to selecting the first available option
      dropdown.selectedIndex = 0;
      loadPrompts(dropdown.value); // Load prompts for the first selected option
    } else {
         // Handle case where there are no categories at all
         loadPrompts(); // Load all (which will likely show 'no prompts')
    }
  }
}

// --- Helper to populate category dropdown in modals ---
function populateCategoryDropdown(selectElementId, selectedCategoryId = null) {
    const selectEl = document.getElementById(selectElementId);
    if (!selectEl) {
        console.error(`Sidebar Dropdown element "${selectElementId}" not found.`);
        return;
    }

    chrome.storage.local.get(['userCategories'], function(result) {
        const userCategories = result.userCategories || [];
        const staticCoreCategories = CORE_CATEGORIES; // Use constant
        
        const allAssignableCategories = [...staticCoreCategories, ...userCategories]
                                            .sort((a, b) => a.name.localeCompare(b.name)); 

        selectEl.innerHTML = allAssignableCategories.map(cat => 
            `<option value="${cat.id}" ${cat.id === selectedCategoryId ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
        
        if (!selectedCategoryId && selectEl.options.length > 0) {
             selectEl.selectedIndex = 0;
        }
    });
}


// --- Prompt Loading, Rendering, Modals etc. ---

function loadPrompts(categoryId = 'all') {
  chrome.storage.local.get(['corePrompts', 'userPrompts', 'favorites', 'recentlyUsed'], function(result) {
    let allPrompts = [...(result.corePrompts || []), ...(result.userPrompts || [])];
    const favorites = result.favorites || [];
    const recentlyUsed = result.recentlyUsed || [];

    let filteredPrompts;
    if (categoryId === 'recent') {
      filteredPrompts = recentlyUsed.map(recentId => allPrompts.find(p => p.id === recentId)).filter(Boolean);
    } else if (categoryId === 'favorites') {
      filteredPrompts = allPrompts.filter(p => favorites.includes(p.id));
    } else if (categoryId !== 'all') {
      filteredPrompts = allPrompts.filter(p => p.category === categoryId);
    } else {
      filteredPrompts = allPrompts; 
    }

    filteredPrompts = filteredPrompts.map(prompt => ({
      ...prompt,
      isFavorite: favorites.includes(prompt.id)
    }));

    const promptCount = document.getElementById('promptCount');
    if (promptCount) {
      promptCount.textContent = filteredPrompts.length;
    }

    renderPrompts(filteredPrompts);
  });
}

function renderPrompts(prompts) {
  const promptsList = document.getElementById('promptsList');
  if (!promptsList) return;
  promptsList.innerHTML = '';

  if (prompts.length === 0) {
    promptsList.innerHTML = `<div class="text-center text-gray-500 py-4 text-xs">No prompts found.</div>`;
    return;
  }

  prompts.forEach(prompt => {
    const promptCard = document.createElement('div');
    // Added shadow-sm based on previous request
    promptCard.className = 'bg-white rounded-md border border-gray-200 p-2 mb-2 hover:shadow-md shadow-sm transition-shadow duration-200'; 
    promptCard.dataset.promptId = prompt.id;

    const tags = prompt.tags || [];
    const visibleTags = tags.slice(0, 2);
    const hasMoreTags = tags.length > 2;
    const tagsHtml = visibleTags.map(tag => `<span class="text-xs px-1 py-0.5 rounded-full bg-blue-100 text-blue-700">${tag}</span>`).join('');

    promptCard.innerHTML = `
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-medium text-blue-600 flex-1 mr-1 truncate" title="${prompt.title}">${prompt.title}</h3>
        ${prompt.isFavorite ? '<span class="text-red-500 text-xs">&starf;</span>' : ''}
      </div>
      <p class="text-xs text-gray-600 my-1 line-clamp-2" title="${prompt.description || ''}">${prompt.description || ''}</p>
      <div class="flex flex-wrap gap-1 mb-1">
        ${tagsHtml}
        ${hasMoreTags ? `<span class="text-xs text-gray-500">+${tags.length - 2}</span>` : ''}
      </div>
      <div class="flex justify-end gap-1 border-t border-gray-100 pt-1 mt-1"> <!-- Added border -->
        <button title="Favorite" class="p-0.5 text-gray-400 hover:text-yellow-500 favorite-btn" data-prompt-id="${prompt.id}">
          <svg class="w-3 h-3" fill="${prompt.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
        </button>
        <button title="Copy" class="p-0.5 text-gray-400 hover:text-blue-600 copy-btn" data-prompt-id="${prompt.id}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
        <button title="Edit" class="p-0.5 text-gray-400 hover:text-green-600 edit-btn" data-prompt-id="${prompt.id}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </button>
        ${prompt.isUserCreated ? `
        <button title="Delete" class="p-0.5 text-gray-400 hover:text-red-600 delete-btn" data-prompt-id="${prompt.id}">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
        ` : ''}
      </div>
    `;
    
    // Add click listener for variable modal if needed
    if (detectVariables(prompt.promptText).length > 0) {
       promptCard.style.cursor = 'pointer'; 
       promptCard.title = "Click to replace variables and copy";
       promptCard.addEventListener('click', () => handleCopyPrompt(prompt));
    } else {
        promptCard.title = prompt.title; // Basic tooltip
    }

    // Add listeners for buttons within the card
    promptCard.querySelector('.copy-btn')?.addEventListener('click', (e) => { e.stopPropagation(); handleCopyPrompt(prompt); });
    promptCard.querySelector('.favorite-btn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(prompt.id); });
    promptCard.querySelector('.edit-btn')?.addEventListener('click', (e) => { e.stopPropagation(); showNewPromptModal(prompt.id); }); // Use showNewPromptModal for edit

    if (prompt.isUserCreated) {
      const deleteBtn = promptCard.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deletePrompt(prompt.id, prompt.title); }); // Use deletePrompt
      }
    }

    promptsList.appendChild(promptCard);
  });
}

// --- Copy Handling (includes variable modal logic) ---
function handleCopyPrompt(prompt) {
  // Retrieve the raw prompt text
  let rawPromptText = prompt.promptText || '';

  // Normalize newlines: Replace literal '\\n' with actual newline characters '\n'
  const normalizedPromptText = rawPromptText.replace(/\\n/g, '\n');

  // Check for variables in the normalized text
  const variables = detectVariables(normalizedPromptText);
  
  if (variables.length > 0) {
    // Create a prompt object with the *normalized* text for the variable modal
    const modalPromptData = {
      ...prompt,
      promptText: normalizedPromptText 
    };
    // Pass the *normalized* data to the variable modal
    showVariableModal(modalPromptData, variables); 
  } else {
    // Copy the *normalized* text directly
    copyToClipboard(normalizedPromptText);
    addToRecentlyUsed(prompt.id);
  }
}

function detectVariables(promptText) {
  if (typeof promptText !== 'string') return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  while ((match = regex.exec(promptText)) !== null) {
    const varName = match[1].trim();
    if(varName) variables.push(varName);
  }
  return [...new Set(variables)];
}

function showVariableModal(prompt, variables) {
  let modalContainer = document.getElementById('variableModal');
  if (!modalContainer) return;

  modalContainer.classList.remove('hidden');
  modalContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg w-full max-w-xs">
      <div class="p-2 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-sm font-medium">Customize & Copy</h2>
        <button id="closeVarModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-3">
        <p class="text-xs text-gray-600 mb-3">Replace variables for "<span class="font-semibold">${prompt.title}</span>".</p>
        <div id="variableFields" class="space-y-3 max-h-96 overflow-y-auto pr-1">
          ${variables.map(variable => {
            const lowerVar = variable.toLowerCase();
            const isTimeVar = ['time', 'length', 'duration', 'trt'].some(kw => lowerVar.includes(kw));
            const label = variable.replace(/[_-]/g, ' ');

            if (isTimeVar) {
              // Render select dropdown for time variables
              return `
                <div class="space-y-1">
                  <label for="var-${variable}" class="block text-xs font-medium text-gray-700 capitalize">${label}:</label>
                  <select id="var-${variable}" name="var-${variable}" class="w-full p-1.5 text-xs border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="10 seconds">10s</option>
                    <option value="15 seconds">15s</option>
                    <option value="30 seconds">30s</option>
                    <option value="60 seconds">60s</option>
                    <option value="90 seconds">90s</option>
                  </select>
                </div>
              `;
            } else {
              // Render standard text input for other variables
              return `
                <div class="space-y-1">
                  <label for="var-${variable}" class="block text-xs font-medium text-gray-700 capitalize">${label}:</label>
                  <input type="text" id="var-${variable}" placeholder="${getPlaceholderExample(variable)}" class="w-full p-1.5 text-xs border border-gray-300 rounded-md"/>
                </div>
              `;
            }
          }).join('')}
        </div>
        \
        <!-- Preview Area -->\
        <div class=\"mt-3 p-1.5 border rounded bg-gray-50 max-h-32 overflow-y-auto hidden text-xs\" id=\"variablePreviewArea\">\
            <p class=\"text-gray-500 mb-0.5 font-semibold\">Preview:</p>\
            <pre class=\"whitespace-pre-wrap\" id=\"variablePreviewText\"></pre>\
        </div>\

        <div class=\"flex justify-end gap-1 mt-4\">\
          <button id=\"cancelVarBtn\" class=\"px-2 py-1 text-xs text-gray-600 rounded-md border border-gray-300 hover:bg-gray-50\">Cancel</button>\
          <button id=\"previewVarBtn\" type=\"button\" title=\"Update Preview\" class=\"px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-md border border-gray-300 hover:bg-gray-200\">Preview</button>\
          <button id=\"copyVarBtn\" class=\"px-2 py-1 text-xs bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700\">\
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Copy
          </button>\
        </div>\
      </div>
    </div>`;

  document.getElementById('closeVarModal')?.addEventListener('click', () => { modalContainer.classList.add('hidden'); modalContainer.innerHTML=''; });
  document.getElementById('cancelVarBtn')?.addEventListener('click', () => { modalContainer.classList.add('hidden'); modalContainer.innerHTML=''; });

  // Preview button listener
  const previewBtn = document.getElementById('previewVarBtn');
  const previewArea = document.getElementById('variablePreviewArea');
  const previewTextEl = document.getElementById('variablePreviewText');
  if (previewBtn && previewArea && previewTextEl) {
      previewBtn.addEventListener('click', () => {
          const replacements = {};
          variables.forEach(variable => {
              replacements[variable] = document.getElementById(`var-${variable}`)?.value || `{{${variable}}}`;
          });
          // Use the normalized prompt text passed into this function
          previewTextEl.textContent = replaceVariables(prompt.promptText, replacements);
          previewArea.classList.remove('hidden');
      });
  }

  document.getElementById('copyVarBtn')?.addEventListener('click', () => {
    const replacements = {};
    variables.forEach(variable => {
      const inputEl = document.getElementById(`var-${variable}`);
      replacements[variable] = inputEl ? inputEl.value : `{{${variable}}}`; // Use placeholder if input missing
    });
    // Use the normalized prompt text passed into this function
    const replacedText = replaceVariables(prompt.promptText, replacements);
    copyToClipboard(replacedText);
    addToRecentlyUsed(prompt.id);
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML='';
  });
  
  const firstInput = modalContainer.querySelector('#variableFields input[type="text"]');
  if (firstInput) firstInput.focus();
}

function getPlaceholderExample(variable) {
  const lowerVar = variable.toLowerCase();
  const examples = {
    'artist': 'The Rolling Stones', 'artist_name': 'The Rolling Stones',
    'song': 'Paint It Black', 'song_title': 'Paint It Black',
    'album': 'Aftermath', 'album_name': 'Aftermath',
    'year': '1985', 'release_year': '1978',
    'genre': '80s, Rock, Top 40, etc.',
    'weather': 'Sunny, 75°F', 'condition': 'clear skies',
    'guest': 'Jane Doe', 'guest_name': 'Jane Doe',
    'station': 'WXYZ', 'station_call': 'WXYZ',
    'show': 'Morning Drive', 'show_name': 'Morning Drive',
    'time': '15 seconds', 'day': 'Friday',
    'location': 'Downtown', 'city': 'New York',
    'name': 'Listener Name', 'caller': 'Caller Name',
    'topic': 'Your Topic', 'event': 'Summer Concert',
    'music_genre': '80s, Rock, Top 40, etc.', 'theme_emotion': 'Happy, Sad, Freedom, etc.'
  };
  for (const key in examples) {
    if (lowerVar.includes(key.replace(/_/g, ''))) return examples[key];
  }
  return 'your text here';
}

function replaceVariables(promptText, replacements) {
  if (typeof promptText !== 'string') return '';
  let result = promptText;
  Object.entries(replacements).forEach(([variable, value]) => {
    const escapedVar = variable.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    result = result.replace(new RegExp(`\\{\\{${escapedVar}\\}\\}`, 'g'), value || `{{${variable}}}`); // Keep placeholder if value is empty
  });
  return result;
}

// --- Clipboard, Toast, Favorites, Recents --- (Assume functions exist and work)
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Copied!'), () => showToast('Copy failed', 'error'));
}

function showToast(message, type = 'success') {
  const toastId = 'sidebar-toast-notification';
  // Remove existing toast first to prevent overlap
  const existingToast = document.getElementById(toastId);
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = toastId;
  
  let bgColor = 'bg-green-500'; // Success default
  if (type === 'error') bgColor = 'bg-red-500';
  if (type === 'warning') bgColor = 'bg-yellow-500';

  // Add base classes + initial state for animation
  // Use smaller font and padding for sidebar
  toast.className = `fixed bottom-3 right-3 px-3 py-1.5 rounded-md shadow-lg ${bgColor} text-white text-xs transition-opacity duration-300 ease-in-out z-[9999] opacity-0`; 

  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0');
      toast.classList.add('opacity-100');
    });
  });

  // Set timeout to start fade out and remove
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');

    // Remove after fade out transition
    toast.addEventListener('transitionend', () => {
      const currentToast = document.getElementById(toastId);
      if (currentToast === toast) {
        currentToast.remove();
      }
    }, { once: true });
  }, 3000); // Start fade-out after 3 seconds
}

function toggleFavorite(promptId) {
  chrome.storage.local.get(['favorites'], function(result) {
    let favorites = result.favorites || [];
    const index = favorites.indexOf(promptId);
    if (index === -1) favorites.push(promptId); else favorites.splice(index, 1);
    chrome.storage.local.set({ favorites }, function() {
      const categoryDropdown = document.getElementById('categoryDropdown');
      const activeCategory = categoryDropdown ? categoryDropdown.value : 'all';
      loadPrompts(activeCategory);
      loadCategories(); // Refresh counts
    });
  });
}

function addToRecentlyUsed(promptId) {
  chrome.storage.local.get(['recentlyUsed'], function(result) {
    let recentlyUsed = result.recentlyUsed || [];
    recentlyUsed = recentlyUsed.filter(id => id !== promptId);
    recentlyUsed.unshift(promptId);
    if (recentlyUsed.length > 15) recentlyUsed = recentlyUsed.slice(0, 15);
    chrome.storage.local.set({ recentlyUsed }, () => {
        // Maybe refresh recent count if viewing?
        const categoryDropdown = document.getElementById('categoryDropdown');
         if (categoryDropdown && categoryDropdown.value === 'recent') loadCategories();
    });
    // Increment usage count logic could be added here too
  });
}

// --- New/Edit Prompt Modal (Sidebar Version) ---
function showNewPromptModal(promptIdToEdit = null) {
  const modalContainer = document.getElementById('newPromptModal'); 
  if (!modalContainer) {
    console.error("Modal container #newPromptModal not found in sidebar.html");
    return;
  }
  modalContainer.classList.remove('hidden');

  const isEditing = promptIdToEdit !== null;
  const modalTitle = isEditing ? 'Edit Prompt' : 'New Prompt';
  const saveButtonText = isEditing ? 'Save Changes' : 'Create Prompt';

  if (isEditing) {
      chrome.storage.local.get(['corePrompts', 'userPrompts'], function(result) {
          const allPrompts = [...(result.corePrompts || []), ...(result.userPrompts || [])];
          const prompt = allPrompts.find(p => p.id === promptIdToEdit);
          if (prompt) {
              renderNewEditModalContent(modalContainer, modalTitle, saveButtonText, prompt);
          } else {
              modalContainer.classList.add('hidden'); 
          }
      });
  } else {
      renderNewEditModalContent(modalContainer, modalTitle, saveButtonText, null);
  }
}

function renderNewEditModalContent(modalContainer, modalTitle, saveButtonText, promptData = null) {
    const isEditing = promptData !== null;
    const promptId = promptData?.id || '';
    const title = promptData?.title || '';
    const description = promptData?.description || '';
    const category = promptData?.category || null;
    
    // **Normalize promptText newlines *before* displaying in textarea**
    let rawPromptText = promptData?.promptText || '';
    const normalizedPromptText = rawPromptText.replace(/\\n/g, '\n');
    
    const tags = promptData?.tags || [];

    // Using text-xs for sidebar modal elements for compactness
    modalContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      <div class="p-2 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-base font-medium">${modalTitle}</h2> <!-- Smaller title -->
        <button id="closeNewPromptModal" class="text-gray-400 hover:text-gray-600 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-3 max-h-[70vh] overflow-y-auto"> <!-- Adjusted padding -->
        <form id="promptForm" class="space-y-3"> <!-- Reduced spacing -->
          <input type="hidden" id="promptId" value="${promptId}">
          <div>
            <label for="promptTitle" class="block text-xs font-medium text-gray-700 mb-0.5">Title*</label>
            <input type="text" id="promptTitle" name="promptTitle" class="w-full p-1.5 text-xs border border-gray-300 rounded-md" value="${title}" required />
          </div>
          <div>
            <label for="promptDescription" class="block text-xs font-medium text-gray-700 mb-0.5">Desc (Optional)</label>
            <textarea id="promptDescription" name="promptDescription" class="w-full p-1.5 text-xs border border-gray-300 rounded-md h-14 resize-none" maxlength="200">${description}</textarea>
            <div class="text-xs text-gray-500 mt-0.5 text-right"><span id="charCount">${description.length}</span>/200</div>
          </div>
          <div>
            <label for="promptCategory" class="block text-xs font-medium text-gray-700 mb-0.5">Category</label>
            <select id="promptCategory" name="promptCategory" class="w-full p-1.5 text-xs border border-gray-300 rounded-md bg-white">
              <option value="">Loading...</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-0.5">Tags (Optional)</label>
            <div id="tagsContainer" class="flex flex-wrap gap-1 mb-1 p-1 border border-gray-200 rounded-md min-h-[30px]"></div>
            <input type="text" id="newTagInput" placeholder="Tag & Enter..." class="w-full p-1.5 text-xs border border-gray-300 rounded-md"/>
            <input type="hidden" id="tagsData" name="tagsData" value="${tags.join(',')}">
          </div>
          <div>
            <label for="promptText" class="block text-xs font-medium text-gray-700 mb-0.5">Prompt Text*</label>
            <textarea id="promptText" name="promptText" placeholder="Prompt text... Use {{var}}..." class="w-full p-1.5 border border-gray-300 rounded-md h-32 font-mono text-xs resize-y" required>${normalizedPromptText}</textarea>
          </div>
        </form>
      </div>
      <div class="p-2 border-t border-gray-200 flex justify-end gap-1.5"> <!-- Adjusted padding/gap -->
        <button id="cancelNewPrompt" type="button" class="px-3 py-1 text-xs text-gray-700 rounded-md border border-gray-300">Cancel</button>
        <button id="saveNewPrompt" type="button" class="px-3 py-1 text-xs bg-blue-600 text-white rounded-md">${saveButtonText}</button>
      </div>
    </div>
    `;

    // Populate category dropdown for the sidebar modal
    populateCategoryDropdown('promptCategory', category);

    const descriptionEl = document.getElementById('promptDescription');
    const charCountEl = document.getElementById('charCount');
    if (descriptionEl && charCountEl) {
        descriptionEl.addEventListener('input', () => charCountEl.textContent = descriptionEl.value.length);
    }

    // Setup tags for the sidebar modal
    setupTagInput(tags);

    document.getElementById('closeNewPromptModal')?.addEventListener('click', () => { modalContainer.classList.add('hidden'); modalContainer.innerHTML = ''; });
    document.getElementById('cancelNewPrompt')?.addEventListener('click', () => { modalContainer.classList.add('hidden'); modalContainer.innerHTML = ''; });
    // Pass sidebar context if save needs different refresh logic? For now, assume same save function works.
    document.getElementById('saveNewPrompt')?.addEventListener('click', () => savePrompt(isEditing)); 
}

// Tag input setup (Sidebar version - ensure IDs match the sidebar modal HTML)
function setupTagInput(initialTags = []) {
    const tagsContainer = document.getElementById('tagsContainer'); // Ensure this ID exists in sidebar modal HTML
    const tagInput = document.getElementById('newTagInput');     // Ensure this ID exists
    const tagsDataInput = document.getElementById('tagsData');   // Ensure this ID exists
    let currentTags = [...initialTags];

    if (!tagsContainer || !tagInput || !tagsDataInput) return;

    function renderTags() {
        tagsContainer.innerHTML = ''; 
        currentTags.forEach((tag, index) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1'; // Slightly smaller padding
            tagEl.innerHTML = `${tag}<button type="button" class="ml-1 text-blue-400 hover:text-blue-600" data-index="${index}">&times;</button>`;
            tagEl.querySelector('button').addEventListener('click', (e) => {
                currentTags.splice(parseInt(e.currentTarget.dataset.index, 10), 1);
                renderTags();
            });
            tagsContainer.appendChild(tagEl);
        });
        tagsDataInput.value = currentTags.join(',');
    }
    renderTags();

    tagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.value.trim().replace(/,/g, '');
            if (newTag && !currentTags.includes(newTag)) {
                currentTags.push(newTag);
                renderTags();
            }
            tagInput.value = '';
        }
    });
    // No suggestion buttons needed for sidebar? If needed, add them.
}

// Save prompt (Sidebar version - might need context for refresh)
function savePrompt(isEditing) {
    const modalContainer = document.getElementById('newPromptModal');
    const id = document.getElementById('promptId')?.value || null;
    const title = document.getElementById('promptTitle')?.value.trim();
    const description = document.getElementById('promptDescription')?.value.trim();
    const category = document.getElementById('promptCategory')?.value;
    const promptText = document.getElementById('promptText')?.value.trim();
    const tagsData = document.getElementById('tagsData')?.value || '';
    const tags = tagsData ? tagsData.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    if (!title || !promptText) {
        alert('Title and Prompt Text are required.'); return;
    }
    if (isEditing && !id) {
       alert("Error: Cannot save edit, ID missing."); return;
    }

    chrome.storage.local.get(['corePrompts', 'userPrompts'], function(result) {
        let corePrompts = result.corePrompts || [];
        let userPrompts = result.userPrompts || [];
        let promptSaved = false;

        if (isEditing) {
            let found = false;
            corePrompts = corePrompts.map(p => (p.id === id ? (found=true, { ...p, title, description, category, promptText, tags, lastEdited: new Date().toISOString() }) : p));
            if (!found) userPrompts = userPrompts.map(p => (p.id === id ? (found=true, { ...p, title, description, category, promptText, tags, lastEdited: new Date().toISOString() }) : p));
            promptSaved = found;
        } else {
            const newPrompt = { id: 'user_' + Date.now(), title, description, category: category || null, promptText, tags, isUserCreated: true, usageCount: 0, createdAt: new Date().toISOString() };
            userPrompts.push(newPrompt);
            promptSaved = true;
        }

        if (promptSaved) {
            chrome.storage.local.set({ corePrompts, userPrompts }, function() {
                if(modalContainer) { modalContainer.classList.add('hidden'); modalContainer.innerHTML = ''; }
                // Refresh sidebar view
                const categoryDropdown = document.getElementById('categoryDropdown');
                const activeCategory = categoryDropdown ? categoryDropdown.value : 'all';
                loadPrompts(activeCategory); // Reload current category
                loadCategories(); // Refresh dropdown counts
                showToast(`Prompt ${isEditing ? 'updated' : 'created'}`);
            });
        } else {
            showToast("Error saving prompt", "error");
        }
    });
}

// Delete Prompt (Sidebar version - refresh sidebar)
function deletePrompt(promptId, promptTitle) {
  if (!confirm(`Delete "${promptTitle || 'this prompt'}"?`)) return;

  chrome.storage.local.get(['userPrompts', 'favorites', 'recentlyUsed'], function(result) {
    let userPrompts = result.userPrompts || [];
    let favorites = result.favorites || [];
    let recentlyUsed = result.recentlyUsed || [];
    const initialLength = userPrompts.length;

    userPrompts = userPrompts.filter(p => p.id !== promptId);

    if (userPrompts.length < initialLength) {
      favorites = favorites.filter(favId => favId !== promptId);
      recentlyUsed = recentlyUsed.filter(recentId => recentId !== promptId);

      chrome.storage.local.set({ userPrompts, favorites, recentlyUsed }, function() {
        const categoryDropdown = document.getElementById('categoryDropdown');
        const activeCategory = categoryDropdown ? categoryDropdown.value : 'all';
        loadCategories(); // Refresh counts
        loadPrompts(activeCategory); // Refresh list
        showToast('Prompt deleted');
      });
    } else {
      showToast('Error deleting prompt', 'error');
    }
  });
}

// --- Initialization ---
function initializeComponents() {
  chrome.storage.local.get(['corePrompts'], function(result) {
    if (!result.corePrompts || result.corePrompts.length === 0) {
      console.log("Initializing default core prompts from JSON…");

      // Fetch directly using the correct relative path
      fetch('../content/prompts.json') // Corrected path
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText || 'Error fetching file'}`);
          return res.json();
        })
        .then(defaultPrompts => {
          // save into storage just like before
          chrome.storage.local.set({ corePrompts: defaultPrompts }, () => {
            console.log("Default prompts loaded from prompts.json");
            loadCategories();
          });
        })
        .catch(err => {
          console.error("Failed to load prompts.json:", err);
          // fallback to hard‑coded prompts if you want:
          // chrome.storage.local.set({ corePrompts: HARD_CODED_ARRAY }, loadCategories);
        });
    } else {
      // already have corePrompts – just continue
      loadCategories();
    }
  });
}

// --- Settings Modal and Category Management (Copied from popup.js) ---
function openSettings() {
  let modal = document.getElementById('settingsModal');
  if (modal) modal.remove(); 

  modal = document.createElement('div');
  modal.id = 'settingsModal';
  // Use sidebar styles for consistency
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-3'; 

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg w-full max-w-sm"> <!-- Smaller max-width for sidebar -->
      <div class="p-2 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-base font-medium">Settings</h2> <!-- Smaller heading -->
        <button id="closeSettingsModal" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>
      <div class="p-3 max-h-[65vh] overflow-y-auto"> <!-- Adjusted padding/height -->
        <!-- Text Size -->
        <div class="mb-4">
          <h3 class="text-sm font-medium mb-2">Text Size</h3>
          <div class="flex items-center space-x-3"> <!-- Adjusted spacing -->
            <label class="inline-flex items-center"><input type="radio" name="fontSize" value="small" class="font-size-radio"><span class="ml-1 text-xs">Small</span></label>
            <label class="inline-flex items-center"><input type="radio" name="fontSize" value="medium" class="font-size-radio"><span class="ml-1 text-sm">Medium</span></label>
            <label class="inline-flex items-center"><input type="radio" name="fontSize" value="large" class="font-size-radio"><span class="ml-1 text-base">Large</span></label>
          </div>
        </div>

        <!-- Category Management -->
        <div class="mb-4 border-t pt-3"> 
          <h3 class="text-sm font-medium mb-2">Category Management</h3>
          <div class="mb-3">
             <h4 class="text-xs font-medium text-gray-600 mb-1">Your Categories (Max ${MAX_USER_CATEGORIES})</h4>
             <ul id="userCategoriesList" class="space-y-1 text-xs">
               <li>Loading...</li>
             </ul>
          </div>
          <div id="addCategorySection"> 
            <h4 class="text-xs font-medium text-gray-600 mb-1">Add New Category</h4>
            <div class="flex gap-1.5">
              <input type="text" id="newCategoryName" placeholder="Category name..." class="flex-grow p-1.5 border border-gray-300 rounded-md text-xs"> <!-- Smaller input -->
              <button id="addCategoryBtn" class="px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-md">Add</button>
            </div>
            <p id="addCategoryError" class="text-xs text-red-500 mt-1 hidden"></p> 
          </div>
        </div>

        <!-- Import/Export -->
        <div class="mb-4 border-t pt-3"> 
          <h3 class="text-sm font-medium mb-2">Prompt Management</h3>
          <p class="text-xs text-gray-600 mb-2">Export your prompts or import a pack.</p>
          <div class="flex gap-1.5">
            <button id="exportBtn" class="px-2.5 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md">Export</button>
            <button id="importBtn" class="px-2.5 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md">Import</button>
          </div>
        </div>
      </div>
      <div class="p-2 border-t border-gray-200 flex justify-end">
        <button id="saveSettingsBtn" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md">Done</button> 
      </div>
    </div>`;

  document.body.appendChild(modal);

  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || { fontSize: 'medium' };
    const fontSizeRadio = modal.querySelector(`.font-size-radio[value="${settings.fontSize}"]`);
    if (fontSizeRadio) {
       fontSizeRadio.checked = true;
    } else {
        const mediumRadio = modal.querySelector(`.font-size-radio[value="medium"]`);
        if(mediumRadio) mediumRadio.checked = true;
    }
  });
  
  loadCategoriesForSettingsModal(); 

  modal.querySelector('#closeSettingsModal').addEventListener('click', () => modal.remove());
  
  modal.querySelector('#saveSettingsBtn').addEventListener('click', function() {
    const fontSizeValue = modal.querySelector('input[name="fontSize"]:checked')?.value || 'medium';
    chrome.storage.local.get(['settings'], function(result) {
        const currentSettings = result.settings || {};
        if (currentSettings.fontSize !== fontSizeValue) {
            currentSettings.fontSize = fontSizeValue;
            chrome.storage.local.set({ settings: currentSettings }, function() {
              applyFontSize(fontSizeValue); // Apply immediately in sidebar
              showToast('Settings updated');
              loadCategories(); // Refresh sidebar categories
              modal.remove();
            });
        } else {
            loadCategories(); // Ensure refresh even if font size didn't change
            modal.remove();
        }
    });
  });

  modal.querySelector('#addCategoryBtn').addEventListener('click', handleAddCategory);
  modal.querySelector('#exportBtn').addEventListener('click', exportPromptData); 
  modal.querySelector('#importBtn').addEventListener('click', importPromptPack);
}

function loadCategoriesForSettingsModal() {
    const userListEl = document.getElementById('userCategoriesList');
    const addCategorySection = document.getElementById('addCategorySection');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newCategoryNameInput = document.getElementById('newCategoryName');
    const addCategoryError = document.getElementById('addCategoryError');

    if (!userListEl || !addCategorySection || !addCategoryBtn || !newCategoryNameInput || !addCategoryError) {
        console.error("Sidebar Settings: One or more category elements not found.");
        return;
    }

    chrome.storage.local.get(['userCategories'], function(result) {
        const userCategories = result.userCategories || [];
        
        userListEl.innerHTML = ''; 
        
        if (userCategories.length === 0) {
            userListEl.innerHTML = '<li class="text-gray-400 italic">No custom categories.</li>';
        } else {
            userCategories.forEach(cat => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between py-0.5 group'; // Reduced padding
                li.dataset.categoryId = cat.id;
                
                // Sidebar adjusted HTML (smaller text/icons)
                li.innerHTML = `
                    <div class="flex-grow mr-1.5">
                        <span class="category-name block">${cat.name}</span>
                        <div class="category-edit-controls hidden mt-0.5"> 
                           <input type="text" value="${cat.name}" class="p-1 border border-gray-300 rounded text-xs w-full">
                           <div class="flex gap-1 mt-1">
                               <button class="save-cat-btn px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Save</button>
                               <button class="cancel-cat-btn px-1.5 py-0.5 bg-gray-300 text-black text-xs rounded hover:bg-gray-400">Cancel</button>
                           </div>
                        </div>
                    </div>
                    <div class="category-view-controls flex gap-1.5 flex-shrink-0">
                        <button title="Edit Name" class="edit-cat-btn text-gray-400 hover:text-blue-600 p-0.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button title="Delete Category" class="delete-cat-btn text-gray-400 hover:text-red-600 p-0.5">
                             <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                `;
                userListEl.appendChild(li);
            });
        }

        if (userCategories.length >= MAX_USER_CATEGORIES) {
            addCategorySection.classList.add('opacity-50');
            addCategoryBtn.disabled = true;
            newCategoryNameInput.disabled = true;
            addCategoryError.textContent = `Max ${MAX_USER_CATEGORIES} categories.`;
            addCategoryError.classList.remove('hidden');
        } else {
            addCategorySection.classList.remove('opacity-50');
            addCategoryBtn.disabled = false;
            newCategoryNameInput.disabled = false;
            addCategoryError.classList.add('hidden');
        }

        userListEl.querySelectorAll('.edit-cat-btn').forEach(btn => btn.addEventListener('click', handleEditCategoryClick));
        userListEl.querySelectorAll('.delete-cat-btn').forEach(btn => btn.addEventListener('click', handleDeleteCategoryClick));
        userListEl.querySelectorAll('.save-cat-btn').forEach(btn => btn.addEventListener('click', handleSaveCategoryClick));
        userListEl.querySelectorAll('.cancel-cat-btn').forEach(btn => btn.addEventListener('click', handleCancelCategoryClick));
    });
}

function handleAddCategory() {
    const inputEl = document.getElementById('newCategoryName');
    const errorEl = document.getElementById('addCategoryError');
    if(!inputEl || !errorEl) return;

    const newName = inputEl.value.trim();
    errorEl.classList.add('hidden');

    if (!newName) {
        errorEl.textContent = 'Name cannot be empty.';
        errorEl.classList.remove('hidden');
        inputEl.focus();
        return;
    }

    chrome.storage.local.get(['userCategories'], function(result) {
        let userCategories = result.userCategories || [];

        if (userCategories.length >= MAX_USER_CATEGORIES) {
             errorEl.textContent = `Max ${MAX_USER_CATEGORIES} categories.`;
             errorEl.classList.remove('hidden');
            return;
        }
        
        const combinedCategories = [...userCategories, ...CORE_CATEGORIES];
        if (combinedCategories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())) {
             errorEl.textContent = 'Name already exists.';
             errorEl.classList.remove('hidden');
             inputEl.focus();
             return;
        }

        const newCategory = {
            id: 'user_cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: newName,
            isUserCreated: true
        };

        userCategories.push(newCategory);

        chrome.storage.local.set({ userCategories }, function() {
            inputEl.value = ''; 
            errorEl.classList.add('hidden'); 
            loadCategoriesForSettingsModal(); // Refresh settings modal list
            loadCategories(); // Refresh sidebar category dropdown
        });
    });
}

function handleEditCategoryClick(event) {
    const li = event.currentTarget.closest('li');
    if(!li) return;
    li.querySelector('.category-name').classList.add('hidden');
    li.querySelector('.category-view-controls').classList.add('hidden');
    
    const editControls = li.querySelector('.category-edit-controls');
    editControls.classList.remove('hidden');
    editControls.querySelector('input[type="text"]').focus();
    editControls.querySelector('input[type="text"]').select();
}

function handleCancelCategoryClick(event) {
    const li = event.currentTarget.closest('li');
    if(!li) return;
    const originalName = li.querySelector('.category-name').textContent;
    li.querySelector('.category-edit-controls input[type="text"]').value = originalName; 
    
    li.querySelector('.category-name').classList.remove('hidden');
    li.querySelector('.category-view-controls').classList.remove('hidden');
    li.querySelector('.category-edit-controls').classList.add('hidden');
}

function handleSaveCategoryClick(event) {
    const li = event.currentTarget.closest('li');
    if(!li) return;
    const categoryId = li.dataset.categoryId;
    const inputEl = li.querySelector('.category-edit-controls input[type="text"]');
    const newName = inputEl.value.trim();

    if (!newName) {
        alert('Category name cannot be empty.');
        inputEl.focus();
        return;
    }

    chrome.storage.local.get(['userCategories'], function(result) {
        let userCategories = result.userCategories || [];
        const categoryIndex = userCategories.findIndex(cat => cat.id === categoryId);

        if (categoryIndex === -1) {
            console.error("Category not found for editing:", categoryId);
            alert("Error: Could not save category.");
            return;
        }

        const currentName = userCategories[categoryIndex].name;
        const combinedOtherCategories = [
            ...userCategories.filter(cat => cat.id !== categoryId), 
            ...CORE_CATEGORIES
        ];
        if (newName.toLowerCase() !== currentName.toLowerCase() &&
            combinedOtherCategories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())) {
             alert('Category name already exists.');
             inputEl.focus();
             return;
        }

        userCategories[categoryIndex].name = newName;

        chrome.storage.local.set({ userCategories }, function() {
            li.querySelector('.category-name').textContent = newName; 
            handleCancelCategoryClick(event); // Close edit controls
            loadCategories(); // Refresh sidebar category dropdown
        });
    });
}

function handleDeleteCategoryClick(event) {
    const li = event.currentTarget.closest('li');
    if(!li) return;
    const categoryId = li.dataset.categoryId;
    const categoryName = li.querySelector('.category-name').textContent;

    if (!confirm(`Delete category "${categoryName}"? \nPrompts will not be deleted.`)) {
        return;
    }

    chrome.storage.local.get(['userCategories', 'userPrompts', 'corePrompts'], function(result) {
        let userCategories = result.userCategories || [];
        let userPrompts = result.userPrompts || [];
        let corePrompts = result.corePrompts || []; 

        userCategories = userCategories.filter(cat => cat.id !== categoryId);

        const updatePromptCategory = (prompt) => {
             if (prompt.category === categoryId) {
                 const { category, ...rest } = prompt;
                 return rest; 
             }
             return prompt;
        };
        
        const updatedUserPrompts = userPrompts.map(updatePromptCategory);
        const updatedCorePrompts = corePrompts.map(updatePromptCategory); 

        chrome.storage.local.set({ 
            userCategories, 
            userPrompts: updatedUserPrompts,
            corePrompts: updatedCorePrompts 
        }, function() {
            loadCategoriesForSettingsModal(); // Refresh settings modal list
            loadCategories(); // Refresh sidebar category dropdown
        });
    });
}

// Apply Font Size Function (Copied from popup.js)
function applyFontSize(size) {
  const root = document.documentElement;
  
  // Sidebar uses smaller base sizes
  switch(size) {
    case 'small':
      root.style.setProperty('--font-size-base', '0.75rem'); // 12px (sm in popup)
      root.style.setProperty('--font-size-sm', '0.625rem'); // 10px (approx)
      root.style.setProperty('--font-size-lg', '0.875rem'); // 14px (base in popup)
      break;
    case 'medium':
      root.style.setProperty('--font-size-base', '0.875rem'); // 14px (base in popup)
      root.style.setProperty('--font-size-sm', '0.75rem'); // 12px (sm in popup)
      root.style.setProperty('--font-size-lg', '1rem'); // 16px (lg in popup)
      break;
    case 'large':
      root.style.setProperty('--font-size-base', '1rem'); // 16px (lg in popup)
      root.style.setProperty('--font-size-sm', '0.875rem'); // 14px (base in popup)
      root.style.setProperty('--font-size-lg', '1.125rem'); // 18px (lg in popup)
      break;
    default: // Default to medium (sidebar adjusted)
      root.style.setProperty('--font-size-base', '0.875rem'); // 14px
      root.style.setProperty('--font-size-sm', '0.75rem'); // 12px
      root.style.setProperty('--font-size-lg', '1rem'); // 16px
  }
}

// Export Function (Copied from popup.js)
function exportPromptData() {
  console.log("Export button clicked. Fetching userPrompts...");
  chrome.storage.local.get(['userPrompts'], function(result) {
    console.log("Storage result for userPrompts:", result);
    const userPrompts = result.userPrompts || [];
    console.log("User prompts found for export:", userPrompts);
    
    if (!Array.isArray(userPrompts)) {
        console.error("Error: userPrompts from storage is not an array!", userPrompts);
        showToast('Export failed: Invalid data format', 'error');
        return;
    }

    const exportData = { 
        type: 'DJPromptsExport', 
        version: '1.0', 
        timestamp: new Date().toISOString(), 
        prompts: userPrompts 
    };
    console.log("Data prepared for export:", exportData);

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dj_prompts_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Prompts exported');
  });
}

// Import Function (Copied from popup.js)
function importPromptPack() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Use the new import function with duplicate checking
    importPromptsWithDuplicateCheck(
      file,
      // Success callback
      (result) => {
        loadCategories(); 
        loadPrompts();
        
        if (result.newPromptsCount === 0 && result.duplicateCount > 0) {
          // All prompts were duplicates, show clear message about this
          showToast(`No new prompts imported - all ${result.duplicateCount} prompts already exist`, 'warning');
        } else if (result.duplicateCount > 0) {
          showToast(`Imported ${result.newPromptsCount} prompts (${result.duplicateCount} duplicates skipped)`);
        } else {
          showToast(`Imported ${result.newPromptsCount} prompts`);
        }
      },
      // Error callback
      (error) => {
        showToast(`Import failed: ${error.message}`, 'error');
      }
    );
  };
  fileInput.click();
}

// --- Upgrade Modal Logic (Sidebar) ---
function showUpgradeModalSidebar() {
  const modal = document.getElementById('upgradeModalSidebar');
  if (modal) {
    modal.classList.remove('hidden');
    // Add listeners for buttons inside the modal
    const closeBtn = document.getElementById('closeUpgradeModalSidebar');
    if(closeBtn) {
        closeBtn.removeEventListener('click', closeUpgradeModalSidebar);
        closeBtn.addEventListener('click', closeUpgradeModalSidebar);
    }
    
    // Add event listeners for the new buttons
    const cancelBtn = document.getElementById('cancelUpgradeBtnSidebar');
    if(cancelBtn) {
        cancelBtn.removeEventListener('click', closeUpgradeModalSidebar);
        cancelBtn.addEventListener('click', closeUpgradeModalSidebar);
    }
    
    const confirmBtn = document.getElementById('confirmUpgradeBtnSidebar');
    if(confirmBtn) {
        confirmBtn.removeEventListener('click', handleUpgradeClickSidebar);
        confirmBtn.addEventListener('click', handleUpgradeClickSidebar);
    }
  }
}

function closeUpgradeModalSidebar() {
  const modal = document.getElementById('upgradeModalSidebar');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Function to handle the actual upgrade action
function handleUpgradeClickSidebar() {
    const upgradeUrl = "https://radiodjdude.com/RoboShowPrep/"; // Replace with your actual URL
    chrome.tabs.create({ url: upgradeUrl });
    closeUpgradeModalSidebar();
}
// --- End Upgrade Modal Logic ---