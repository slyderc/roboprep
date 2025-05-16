// Import the formatting utility
import { formatPromptForDisplay } from '../components/formatPromptDisplay.js';
import { importPromptsWithDuplicateCheck } from '../components/importPromptsWithDuplicateCheck.js';

// Apply Font Size Function
function applyFontSize(size) {
  const root = document.documentElement;
  // Remove existing size classes
  root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');

  // Add the new size class
  switch(size) {
    case 'small':
      root.classList.add('font-size-small');
      break;
    case 'medium':
      root.classList.add('font-size-medium');
      break;
    case 'large':
      root.classList.add('font-size-large');
      break;
    default: // Default to medium
      root.classList.add('font-size-medium');
  }
  
  // Update CSS variables for specific elements
  updateElementFontSizes(size);
}

// Add this new function to explicitly set element-specific font sizes
function updateElementFontSizes(size) {
  const root = document.documentElement;
  
  // Set specific font size values based on the size option
  if (size === 'small') {
    root.style.setProperty('--prompt-title-size', '0.875rem');
    root.style.setProperty('--prompt-desc-size', '0.75rem');
    root.style.setProperty('--prompt-tag-size', '0.7rem');
    root.style.setProperty('--category-name-size', '0.875rem');
    root.style.setProperty('--category-count-size', '0.7rem');
  } else if (size === 'medium') {
    root.style.setProperty('--prompt-title-size', '1rem');
    root.style.setProperty('--prompt-desc-size', '0.875rem');
    root.style.setProperty('--prompt-tag-size', '0.75rem');
    root.style.setProperty('--category-name-size', '1rem');
    root.style.setProperty('--category-count-size', '0.75rem');
  } else if (size === 'large') {
    root.style.setProperty('--prompt-title-size', '1.125rem');
    root.style.setProperty('--prompt-desc-size', '1rem');
    root.style.setProperty('--prompt-tag-size', '0.875rem');
    root.style.setProperty('--category-name-size', '1.125rem');
    root.style.setProperty('--category-count-size', '0.875rem');
  }
}

// Export Function
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

// Import Function
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

// --- Constants ---
const CORE_CATEGORIES = [ // Define core categories (adjust as needed)
    { id: 'artist-bio', name: 'Artist Bio' },
    { id: 'song-story', name: 'Song Story' },
    { id: 'show-segments', name: 'Show Segments' },
    { id: 'music-trivia', name: 'Music Trivia' },
    { id: 'interviews', name: 'Interviews' },
    { id: 'weather', name: 'Weather' },
    { id: 'features', name: 'Features' },
    { id: 'social-media', name: 'Social Media' },
];

const MAX_USER_CATEGORIES = 3;

// --- Settings Modal and Category Management ---
function openSettings() {
  let modal = document.getElementById('settingsModal');
  if (modal) modal.remove(); // Remove existing modal first

  modal = document.createElement('div');
  modal.id = 'settingsModal';
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4'; // Container for modal

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg w-full max-w-sm mx-auto"> <!-- Changed max-w-md to max-w-sm -->
      <div class="p-2 border-b border-gray-200 flex justify-between items-center"> <!-- Changed p-3 to p-2 -->
        <h2 class="text-base font-medium">Settings</h2> <!-- Adjusted text size -->
        <button id="closeSettingsModal" class="text-gray-400 hover:text-gray-600 p-1 text-xl leading-none">&times;</button> <!-- Adjusted styling -->
      </div>
      <div class="p-3 max-h-[65vh] overflow-y-auto"> <!-- Changed p-4 to p-3, max-h-70vh to max-h-65vh -->
        <!-- Text Size -->
        <div class="mb-3"> <!-- Reduced mb-4 -->
          <h3 class="text-sm font-medium mb-1.5">Text Size</h3> <!-- Adjusted text size/mb -->
          <div class="flex items-center space-x-3"> <!-- Reduced space-x-4 -->
            <label class="inline-flex items-center"><input type="radio" name="fontSize" value="small" class="font-size-radio"><span class="ml-1 text-xs">Small</span></label> <!-- Adjusted text size -->
            <label class="inline-flex items-center"><input type="radio" name="fontSize" value="medium" class="font-size-radio"><span class="ml-1 text-sm">Medium</span></label> <!-- Adjusted text size -->
            <label class="inline-flex items-center"><input type="radio" name="fontSize" value="large" class="font-size-radio"><span class="ml-1 text-base">Large</span></label> <!-- Adjusted text size -->
          </div>
        </div>
        <!-- Category Management -->
        <div class="mb-3 border-t pt-3"> <!-- Reduced mb/pt-4 -->
          <h3 class="text-sm font-medium mb-1.5">Category Management</h3> <!-- Adjusted text size/mb -->
          <!-- Removed core categories list -->
          <div class="mb-3"> <!-- Reduced mb-4 -->
             <h4 class="text-xs font-medium text-gray-600 mb-1">Your Categories (Max ${MAX_USER_CATEGORIES})</h4> <!-- Adjusted text size -->
             <ul id="userCategoriesList" class="space-y-1 text-xs"> <!-- Adjusted text/space -->
               <li>Loading...</li>
             </ul>
          </div>
          <div id="addCategorySection"> 
            <h4 class="text-xs font-medium text-gray-600 mb-1">Add New Category</h4> <!-- Adjusted text size -->
            <div class="flex gap-1.5"> <!-- Reduced gap-2 -->
              <input type="text" id="newCategoryName" placeholder="Category name..." class="flex-grow p-1.5 border border-gray-300 rounded-md text-xs"> <!-- Adjusted padding/text -->
              <button id="addCategoryBtn" class="px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-md">Add</button> <!-- Adjusted padding/text -->
            </div>
            <p id="addCategoryError" class="text-xs text-red-500 mt-1 hidden"></p> <!-- Adjusted text size -->
          </div>
        </div>
        <!-- Import/Export -->
        <div class="border-t pt-3"> <!-- Reduced pt-4 -->
          <h3 class="text-sm font-medium mb-1.5">Prompt Management</h3> <!-- Adjusted text size/mb -->
          <p class="text-xs text-gray-600 mb-1.5">Export your prompts or import a pack.</p> <!-- Adjusted text size/mb -->
          <div class="flex gap-1.5"> <!-- Reduced gap-2 -->
            <button id="exportBtn" class="px-2.5 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md">Export</button> <!-- Adjusted padding/text -->
            <button id="importBtn" class="px-2.5 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md">Import</button> <!-- Adjusted padding/text -->
          </div>
        </div>
      </div>
      <div class="p-2 border-t border-gray-200 flex justify-end"> <!-- Changed p-3 to p-2 -->
        <button id="saveSettingsBtn" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md">Done</button> <!-- Adjusted padding/text -->
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
              applyFontSize(fontSizeValue);
              showToast('Settings updated');
              loadCategories(); 
              modal.remove();
            });
        } else {
            loadCategories();
            modal.remove();
        }
    });
  });

  modal.querySelector('#addCategoryBtn').addEventListener('click', handleAddCategory);
  modal.querySelector('#exportBtn').addEventListener('click', exportPromptData); 
  modal.querySelector('#importBtn').addEventListener('click', importPromptPack);
}

function loadCategoriesForSettingsModal() {
    const coreListEl = document.getElementById('coreCategoriesList'); // This line can be removed
    const userListEl = document.getElementById('userCategoriesList');
    const addCategorySection = document.getElementById('addCategorySection');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newCategoryNameInput = document.getElementById('newCategoryName');
    const addCategoryError = document.getElementById('addCategoryError');

    if (/*!coreListEl ||*/ !userListEl || !addCategorySection || !addCategoryBtn || !newCategoryNameInput || !addCategoryError) {
        console.error("One or more category settings elements not found.");
        return;
    }

    chrome.storage.local.get(['userCategories'], function(result) {
        const userCategories = result.userCategories || [];
        
        userListEl.innerHTML = ''; 
        
        if (userCategories.length === 0) {
            userListEl.innerHTML = '<li class="text-gray-400 italic">No custom categories added yet.</li>';
        } else {
            userCategories.forEach(cat => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between py-1 group';
                li.dataset.categoryId = cat.id;
                
                li.innerHTML = `
                    <div class="flex-grow mr-2">
                        <span class="category-name block">${cat.name}</span>
                        <div class="category-edit-controls hidden mt-1"> 
                           <input type="text" value="${cat.name}" class="p-1 border border-gray-300 rounded text-sm w-full">
                           <div class="flex gap-1 mt-1">
                               <button class="save-cat-btn px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Save</button>
                               <button class="cancel-cat-btn px-2 py-1 bg-gray-300 text-black text-xs rounded hover:bg-gray-400">Cancel</button>
                           </div>
                        </div>
                    </div>
                    <div class="category-view-controls flex gap-2 flex-shrink-0">
                        <button title="Edit Name" class="edit-cat-btn text-gray-400 hover:text-blue-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button title="Delete Category" class="delete-cat-btn text-gray-400 hover:text-red-600">
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
            addCategoryError.textContent = `Maximum of ${MAX_USER_CATEGORIES} custom categories reached.`;
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
        errorEl.textContent = 'Category name cannot be empty.';
        errorEl.classList.remove('hidden');
        inputEl.focus();
        return;
    }

    chrome.storage.local.get(['userCategories'], function(result) {
        let userCategories = result.userCategories || [];

        if (userCategories.length >= MAX_USER_CATEGORIES) {
             errorEl.textContent = `Maximum of ${MAX_USER_CATEGORIES} custom categories reached.`;
             errorEl.classList.remove('hidden');
            return;
        }
        
        const combinedCategories = [...userCategories, ...CORE_CATEGORIES];
        if (combinedCategories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())) {
             errorEl.textContent = 'Category name already exists.';
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
            loadCategoriesForSettingsModal(); 
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
            handleCancelCategoryClick(event);
        });
    });
}

function handleDeleteCategoryClick(event) {
    const li = event.currentTarget.closest('li');
    if(!li) return;
    const categoryId = li.dataset.categoryId;
    const categoryName = li.querySelector('.category-name').textContent;

    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? \n\nPrompts in this category will NOT be deleted, but they will no longer be assigned to this category.`)) {
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
            loadCategoriesForSettingsModal();
        });
    });
}

// --- End Settings Modal and Category Management ---

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const isFloating = urlParams.get('mode') === 'floating';
  const openFloatingBtn = document.getElementById('openFloatingBtn');
  
  if (isFloating) {
    if (openFloatingBtn) {
      openFloatingBtn.classList.add('hidden'); 
    }
    document.body.classList.add('w-full', 'h-full');
    document.body.classList.remove('w-96');
    
    // Add specific class for floating window to help with styling
    document.body.classList.add('floating-window-mode');
  }
  
  loadCategories();
  
  if (openFloatingBtn) {
    openFloatingBtn.addEventListener('click', openFloatingWindow);
  }
  
  const newPromptBtn = document.getElementById('newPromptBtn');
  if (newPromptBtn) {
    newPromptBtn.addEventListener('click', () => showNewPromptModal());
  }
  
  // Add event listener for the header new prompt button
  const headerNewPromptBtn = document.getElementById('headerNewPromptBtn');
  if (headerNewPromptBtn) {
    headerNewPromptBtn.addEventListener('click', () => showNewPromptModal());
  }
  
  initializeComponents();
  
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || { fontSize: 'medium' };
    applyFontSize(settings.fontSize || 'medium');
  });

  const settingsBtnContainer = document.querySelector('header .flex.items-center.gap-2');
  if (settingsBtnContainer && !document.getElementById('settingsBtn')) {
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settingsBtn';
    settingsBtn.title = "Settings";
    settingsBtn.className = 'p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
    settingsBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    `;
    // Append button to the container (at the end) instead of prepending it
    settingsBtnContainer.appendChild(settingsBtn);
  }
  
  // Ensure listener is attached (handles creation and hot reload)
  const settingsButton = document.getElementById('settingsBtn');
  if (settingsButton) {
      settingsButton.removeEventListener('click', openSettings); // Remove potential duplicates
      settingsButton.addEventListener('click', openSettings);
  }

  // Add listener for Upgrade button
  const upgradeButton = document.getElementById('upgradeBtnPopup');
  if (upgradeButton) {
    upgradeButton.addEventListener('click', showUpgradeModalPopup);
  }
  // --- End Settings Button Logic ---
});

// --- Upgrade Modal Logic ---
function showUpgradeModalPopup() {
  const modal = document.getElementById('upgradeModalPopup');
  if (modal) {
    modal.classList.remove('hidden');
    // Add listeners for buttons inside the modal *now* that it's potentially visible
    const closeBtn = document.getElementById('closeUpgradeModalPopup');
    if(closeBtn) {
        // Ensure listener isn't added multiple times if modal is re-shown
        closeBtn.removeEventListener('click', closeUpgradeModalPopup);
        closeBtn.addEventListener('click', closeUpgradeModalPopup);
    }
    
    // Add event listeners for the new buttons
    const cancelBtn = document.getElementById('cancelUpgradeBtn');
    if(cancelBtn) {
        cancelBtn.removeEventListener('click', closeUpgradeModalPopup);
        cancelBtn.addEventListener('click', closeUpgradeModalPopup);
    }
    
    const confirmBtn = document.getElementById('confirmUpgradeBtn');
    if(confirmBtn) {
        confirmBtn.removeEventListener('click', handleUpgradeClick);
        confirmBtn.addEventListener('click', handleUpgradeClick);
    }
  }
}

function closeUpgradeModalPopup() {
  const modal = document.getElementById('upgradeModalPopup');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Function to handle the actual upgrade action (e.g., open URL)
function handleUpgradeClick() {
    const upgradeUrl = "https://radiodjdude.com/RoboShowPrep/"; // Replace with your actual URL
    chrome.tabs.create({ url: upgradeUrl });
    closeUpgradeModalPopup();
}
// --- End Upgrade Modal Logic ---


function openFloatingWindow() {
  // Send message and handle the potential error
  chrome.runtime.sendMessage({ action: "openFloatingWindow" })
    .catch(error => {
      console.debug("Message sending failed, window might already be closing:", error);
    });
  
  // Add a slight delay before closing
  setTimeout(() => {
    window.close();
  }, 50);
}

// --- Main Category Loading and Rendering ---
function loadCategories() {
  // Fetch necessary data including userCategories
  chrome.storage.local.get(['corePrompts', 'userPrompts', 'favorites', 'recentlyUsed', 'userCategories', 'settings'], function(result) {
    const allPrompts = [...(result.corePrompts || []), ...(result.userPrompts || [])];
    const favorites = result.favorites || [];
    const recentlyUsed = result.recentlyUsed || [];
    const userCategories = result.userCategories || []; // Get user categories
    const settings = result.settings || { fontSize: 'medium' }; // Get settings for font size

    // Combine core and user categories (filter out special ones handled separately)
    const staticCoreCategories = CORE_CATEGORIES // Use the constant defined above
        .filter(cat => !['all', 'recent', 'favorites'].includes(cat.id)); // Exclude special views if they are handled differently in main UI
    
    const allDefinedCategories = [...staticCoreCategories, ...userCategories];

    // Base categories structure for the popup UI
    let categories = [
        { id: 'all', name: 'All Prompts', count: allPrompts.length },
        { id: 'recent', name: 'Recently Used', count: recentlyUsed.length },
        { id: 'favorites', name: 'Favorites', count: favorites.length },
        // Add combined core/user categories with counts
        ...allDefinedCategories.map(category => ({
            ...category, // id, name, isUserCreated (if exists)
            count: allPrompts.filter(p => p.category === category.id).length
        }))
    ];

    renderCategories(categories);
    
    // Apply font size setting - ensure it's applied after rendering
    updateElementFontSizes(settings.fontSize || 'medium');
  });
}


function renderCategories(categories) { // Remove currentFontSize parameter
  const categoriesList = document.getElementById('categoriesList');
  if (!categoriesList) return; // Exit if element not found
  categoriesList.innerHTML = ''; // Clear previous list

  // Remove text size calculation - rely on base font size and Tailwind rem units
  // let textSizeClass = 'text-sm'; // Default medium
  // if (currentFontSize === 'small') textSizeClass = 'text-xs';
  // if (currentFontSize === 'large') textSizeClass = 'text-base';


  categories.forEach(category => {
    // Skip categories with 0 count, except for special ones maybe? (Optional)
    // if (category.count === 0 && !['all', 'recent', 'favorites'].includes(category.id)) {
    //   return; 
    // }

    const categoryEl = document.createElement('div');
    // Remove text-sm, size handled by CSS var
    categoryEl.className = `px-2 py-1.5 rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-100 text-gray-700`; 
    categoryEl.dataset.categoryId = category.id;
    
    categoryEl.innerHTML = `
      <span>${category.name}</span>
      <span class="bg-gray-200 px-1.5 py-0.5 rounded-full font-medium">${category.count}</span>
    `;
    
    categoryEl.addEventListener('click', () => {
      // Highlight selected category
      document.querySelectorAll('#categoriesList > div').forEach(el => {
        el.classList.remove('bg-blue-100', 'text-blue-700', 'font-semibold');
        el.classList.add('text-gray-700'); // Ensure others are reset
      });
      categoryEl.classList.add('bg-blue-100', 'text-blue-700', 'font-semibold');
      categoryEl.classList.remove('text-gray-700');
      
      // Load prompts for this category
      loadPrompts(category.id);
    });
    
    categoriesList.appendChild(categoryEl);
  });
  
  // Select "All Prompts" by default if it exists
  const allPromptsCategory = categoriesList.querySelector('[data-category-id="all"]');
  if (allPromptsCategory) {
    allPromptsCategory.click(); // Simulate click to load 'All' prompts initially
  } else if (categoriesList.firstChild) {
     categoriesList.firstChild.click(); // Fallback to clicking the first available category
  }
}

// --- Prompt Loading and Rendering ---

function loadPrompts(categoryId = 'all') {
  chrome.storage.local.get(['corePrompts', 'userPrompts', 'favorites', 'recentlyUsed', 'settings'], function(result) {
    let allPrompts = [...(result.corePrompts || []), ...(result.userPrompts || [])];
    const favorites = result.favorites || [];
    const recentlyUsed = result.recentlyUsed || [];
    const settings = result.settings || { fontSize: 'medium' }; // Get settings for font size
    
    let filteredPrompts;
    // Filter by category
    if (categoryId === 'recent') {
      // Get full prompt objects for recently used IDs, maintaining order
      filteredPrompts = recentlyUsed.map(recentId => {
        return allPrompts.find(p => p.id === recentId);
      }).filter(Boolean); // Remove any undefined entries if a prompt was deleted
    } else if (categoryId === 'favorites') { 
       filteredPrompts = allPrompts.filter(p => favorites.includes(p.id));
    } else if (categoryId !== 'all') {
      // Filter by specific category ID, OR include prompts with no category if 'uncategorized' is selected?
      filteredPrompts = allPrompts.filter(p => p.category === categoryId); 
    } else {
       filteredPrompts = allPrompts; // Show all
    }
    
    // Add favorite status
    filteredPrompts = filteredPrompts.map(prompt => ({
      ...prompt,
      isFavorite: favorites.includes(prompt.id)
    }));
    
    // Update the counter
    const promptCountEl = document.getElementById('promptCount');
    if (promptCountEl) {
      promptCountEl.textContent = filteredPrompts.length;
    }
    
    // Render the prompts, passing the current font size
    renderPrompts(filteredPrompts, settings.fontSize || 'medium');
  });
}

// Modified renderPrompts to accept and use fontSize
function renderPrompts(prompts) { // Remove currentFontSize parameter
  const promptsList = document.getElementById('promptsList');
  const promptCountEl = document.getElementById('promptCount');
  promptsList.innerHTML = '';

   if (prompts.length === 0) {
    // Remove text size calculation
    // let emptyMsgSizeClass = 'text-base'; // Medium default
    // if (currentFontSize === 'small') emptyMsgSizeClass = 'text-sm';
    // if (currentFontSize === 'large') emptyMsgSizeClass = 'text-lg';
    
    promptsList.innerHTML = `<div class="text-center text-gray-500 py-8 text-base">No prompts found in this category.</div>`; // Use standard text-base
    promptCountEl.textContent = 0; // Ensure count is 0
    return;
  }

  prompts.forEach(prompt => {
    const promptCard = document.createElement('div');
    promptCard.className = 'bg-white rounded-md border border-gray-200 p-3 hover:shadow-md shadow-sm mb-3 transition-shadow duration-200'; // Added margin-bottom
    promptCard.dataset.promptId = prompt.id;

    const tags = prompt.tags || [];
    const title = document.createElement('h3');
    // Remove font-semibold, just use color and margin. Size is handled by CSS var.
    title.className = `text-blue-600 mb-1`; 
    title.textContent = prompt.title;

    // Create a container for title and star
    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex justify-between items-start'; // Basic flex container

    // Create span for the star (conditionally)
    const starSpan = document.createElement('span');
    if (prompt.isFavorite) {
        starSpan.innerHTML = '&starf;'; // Filled star entity
        starSpan.className = 'text-red-500 ml-2'; // Red color, margin-left
    }
    // Note: If not favorite, the span remains empty and won't be appended or will be invisible

    titleContainer.appendChild(title);
    if (prompt.isFavorite) {
      titleContainer.appendChild(starSpan); // Append star span only if favorite
    }

    const description = document.createElement('p');
    // Remove text-sm, size handled by CSS var
    description.className = `text-gray-600 mb-2`; 
    description.textContent = prompt.description || 'No description available.';

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'flex flex-wrap gap-1 mb-2';
    tags.forEach(tag => {
      const tagEl = document.createElement('span');
      // Remove text-xs, size handled by CSS var
      tagEl.className = `bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full`;
      tagEl.textContent = tag;
      tagsContainer.appendChild(tagEl);
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex items-center justify-end gap-1 mt-2 border-t pt-2 border-gray-100'; // Added top border

    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `p-1 text-gray-400 rounded hover:bg-gray-100 ${prompt.isFavorite ? 'text-red-500 hover:text-red-600' : 'hover:text-yellow-500'}`;
    favoriteBtn.title = prompt.isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    favoriteBtn.innerHTML = `<svg class="w-4 h-4" fill="${prompt.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`; // Slightly larger icon
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(prompt.id);
    });
    
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100';
    copyBtn.title = 'Copy Prompt';
    copyBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`; // Slightly larger icon
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click event
      handleCopyPrompt(prompt); // Use new handler
    });

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'p-1 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100';
    editBtn.title = 'Edit Prompt';
    editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>`; // Slightly larger icon
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      showNewPromptModal(prompt.id); // Pass ID to indicate edit mode
    });

    // Delete button (only for user-created)
    let deleteBtn;
    if (prompt.isUserCreated) {
      deleteBtn = document.createElement('button');
      deleteBtn.className = 'p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100';
      deleteBtn.title = 'Delete Prompt';
      deleteBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`; // Slightly larger icon
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Pass title to deletePrompt for confirmation message
        deletePrompt(prompt.id, prompt.title);
      });
    }
    
    // Add buttons in order: Favorite, Copy, Edit, Delete (if present)
    buttonsContainer.appendChild(favoriteBtn); // Add favorite
    buttonsContainer.appendChild(copyBtn);    // Add copy
    buttonsContainer.appendChild(editBtn);    // Add edit
    if (prompt.isUserCreated && deleteBtn) {
      buttonsContainer.appendChild(deleteBtn); // Add delete last
    }
    
    // Append the title container instead of just the title
    promptCard.appendChild(titleContainer);
    promptCard.appendChild(description);
    if (tags.length > 0) { // Only append tags container if there are tags
       promptCard.appendChild(tagsContainer);
    }
    promptCard.appendChild(buttonsContainer);
    
    // Click event for variable modal (only if prompt has variables)
     if (detectVariables(prompt.promptText).length > 0) {
        // promptCard.style.cursor = 'pointer'; // REMOVE THIS LINE
        promptCard.classList.add('clickable-prompt'); // ADD THIS LINE
        promptCard.title = "Click to replace variables and copy"; // Add tooltip
        promptCard.addEventListener('click', () => handleCopyPrompt(prompt)); // Reuse handleCopyPrompt
    } else {
        // Optional: Add a different tooltip for non-variable prompts?
        promptCard.title = prompt.title; 
    }


    promptsList.appendChild(promptCard);
  });

  // Update total count display
  promptCountEl.textContent = prompts.length;
}


// --- Copy Prompt Handling (including Variables) ---

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
    showVariableModal(modalPromptData, variables);
  } else {
    // Copy the normalized text directly
    copyToClipboard(normalizedPromptText);
    addToRecentlyUsed(prompt.id);
  }
}


function detectVariables(promptText) {
  if (typeof promptText !== 'string') return []; // Handle non-string input
  const regex = /\{\{([^}]+)\}\}/g; // Matches {{variable_name}}
  const variables = [];
  let match;
  
  while ((match = regex.exec(promptText)) !== null) {
     // Trim whitespace from variable name inside braces
    const varName = match[1].trim(); 
    if (varName) { // Ensure variable name is not empty
        variables.push(varName);
    }
  }
  
  // Return unique variable names
  return [...new Set(variables)]; 
}

function showVariableModal(prompt, variables) { // Accepts prompt object with *normalized* text
  const modalContainer = document.getElementById('variableModal'); // Use the container div
  if (!modalContainer) return;

  modalContainer.classList.remove('hidden');
  modalContainer.classList.add('visible'); // Add visible class
  
  // Create the modal content dynamically
  modalContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg">
      <div class="header">
        <h2 class="text-lg font-medium">Customize & Copy</h2>
        <button id="closeVarModal" class="text-gray-400 hover:text-gray-600 p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="content">
        <p class="text-sm text-gray-600 mb-4">
          Enter replacement text for the variables in "<span class="font-semibold">${escapeHtml(prompt.title)}</span>".
        </p>
        
        <div id="variableFields" class="space-y-4 pr-2">
          ${variables.map(variable => {
            const lowerVar = variable.toLowerCase();
            const isTimeVar = ['time', 'length', 'duration', 'trt'].some(kw => lowerVar.includes(kw));
            const label = variable.replace(/[_-]/g, ' ');
            const safeVariable = escapeHtml(variable);
            const safeLabel = escapeHtml(label);

            if (isTimeVar) {
              // Render select dropdown for time variables
              return `
                <div class="space-y-2">
                  <label for="var-${safeVariable}" class="block text-sm font-medium text-gray-700 capitalize">${safeLabel}:</label>
                  <select id="var-${safeVariable}" name="var-${safeVariable}" class="w-full p-2.5 border border-gray-300 rounded-md bg-white">
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
              const placeholder = escapeHtml(getPlaceholderExample(variable));
              return `
                <div class="space-y-2">
                  <label for="var-${safeVariable}" class="block text-sm font-medium text-gray-700 capitalize">${safeLabel}:</label>
                  <input
                    type="text"
                    id="var-${safeVariable}"
                    name="var-${safeVariable}"
                    placeholder="e.g., ${placeholder}"
                    class="w-full p-2.5 border border-gray-300 rounded-md"
                  >
                </div>
              `;
            }
          }).join('')}
        </div>
        
        <!-- Preview Area -->
        <div class="mt-5 p-3 border rounded bg-gray-50 max-h-48 overflow-y-auto hidden" id="variablePreviewArea">
            <p class="text-xs text-gray-500 mb-2 font-semibold">Preview:</p>
            <pre class="text-sm whitespace-pre-wrap" id="variablePreviewText"></pre>
        </div>
      </div>

      <div class="footer">
        <button id="cancelVarBtn" class="px-4 py-2 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50">
          Cancel
        </button>
        <button id="previewVarBtn" type="button" title="Update Preview" class="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded-md border border-gray-300 hover:bg-gray-200">
          Preview
        </button>
        <button id="copyVarBtn" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          Copy Prompt
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners for the new modal elements
  document.getElementById('closeVarModal')?.addEventListener('click', () => {
    modalContainer.classList.add('hidden');
    modalContainer.classList.remove('visible'); // Remove visible class
    modalContainer.innerHTML = ''; // Clear content
  });
  
  document.getElementById('cancelVarBtn')?.addEventListener('click', () => {
    modalContainer.classList.add('hidden');
    modalContainer.classList.remove('visible'); // Remove visible class
    modalContainer.innerHTML = ''; // Clear content
  });
  
   // Preview button listener
   const previewBtn = document.getElementById('previewVarBtn');
   const previewArea = document.getElementById('variablePreviewArea');
   const previewTextEl = document.getElementById('variablePreviewText');
   if (previewBtn && previewArea && previewTextEl) {
       previewBtn.addEventListener('click', () => {
           const replacements = {};
           variables.forEach(variable => {
               // Use the input value or the original placeholder if empty for preview
               replacements[variable] = document.getElementById(`var-${escapeHtml(variable)}`)?.value || `{{${variable}}}`;
           });
           // Use the MODAL's prompt text (which is already normalized) for preview
           previewTextEl.textContent = replaceVariables(prompt.promptText, replacements);
           previewArea.classList.remove('hidden'); // Show preview area
       });
   }
  
  // Copy button listener
  document.getElementById('copyVarBtn')?.addEventListener('click', () => {
    const replacements = {};
    let allFilled = true;
    variables.forEach(variable => {
      const value = document.getElementById(`var-${escapeHtml(variable)}`)?.value;
      // Treat empty string as needing replacement - use placeholder in final text
      replacements[variable] = value || `{{${variable}}}`; 
      if (!value) {
          allFilled = false; // Track if any variables were left empty
      }
    });
    
    // Use the MODAL's prompt text (already normalized) for replacement
    const replacedText = replaceVariables(prompt.promptText, replacements);
    copyToClipboard(replacedText);
    
    // Add to recently used
    addToRecentlyUsed(prompt.id);
    
    modalContainer.classList.add('hidden');
    modalContainer.classList.remove('visible'); // Remove visible class
    modalContainer.innerHTML = ''; // Clear content when closing
  });
  
  // Get the current font size setting and apply it to the modal elements
  chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || { fontSize: 'medium' };
      // Re-apply font size to ensure the modal gets proper sizing
      updateElementFontSizes(settings.fontSize || 'medium');
  });
}


function getPlaceholderExample(variable) {
  // Return contextual examples based on variable name (case-insensitive)
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
  
  // Look for partial matches in the variable name
  for (const key in examples) {
    if (lowerVar.includes(key.replace(/_/g, ''))) { // Allow matching without underscore
      return examples[key];
    }
  }
  
  return 'your text here'; // Generic fallback
}

function replaceVariables(promptText, replacements) {
  if (typeof promptText !== 'string') return '';
  let result = promptText;
  Object.entries(replacements).forEach(([variable, value]) => {
    // Escape regex special characters in variable name for safety
    const escapedVar = variable.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Replace {{variable}} with the provided value
    result = result.replace(new RegExp(`\\{\\{${escapedVar}\\}\\}`, 'g'), value);
  });
  return result;
}


// --- Clipboard and Toast ---

function copyToClipboard(text) {
  // Use the Clipboard API
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Copied to clipboard!');
    })
    .catch(err => {
      console.error('Clipboard API copy failed: ', err);
      // Fallback attempt (might not work in all extension contexts)
      fallbackCopyToClipboard(text); 
    });
}

function fallbackCopyToClipboard(text) {
  // This method is less reliable in extensions due to permissions
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // Make the textarea visually hidden but selectable
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('Copied (using fallback)!');
    } else {
       console.error('Fallback copy command failed.');
       showToast('Copy failed. Please copy manually.', 'error');
    }
  } catch (err) {
    console.error('Error during fallback copy: ', err);
    showToast('Copy failed. Please copy manually.', 'error');
  } finally {
     document.body.removeChild(textArea);
  }
}


function showToast(message, type = 'success') {
  const toastId = 'toast-notification';
  // Remove existing toast first to prevent overlap
  const existingToast = document.getElementById(toastId);
  if (existingToast) {
    // If removed immediately, fade-out might not trigger correctly.
    // Instead, trigger fade-out on existing toast if we want to replace it smoothly.
    // For simplicity now, just remove it.
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = toastId; // Assign ID for potential removal
  let bgColor = 'bg-green-500'; // Success default
  if (type === 'error') bgColor = 'bg-red-500';
  if (type === 'warning') bgColor = 'bg-yellow-500';

  // Add base classes + initial state for animation
  toast.className = `toast-base fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${bgColor} text-white text-sm transition-opacity duration-300 ease-in-out z-[9999] opacity-0`; // Start transparent

  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger fade in by removing opacity-0 shortly after adding to DOM
  requestAnimationFrame(() => {
      requestAnimationFrame(() => { // Double requestAnimationFrame helps ensure transition triggers
          toast.classList.remove('opacity-0');
          toast.classList.add('opacity-100'); // Explicitly set final state if needed by transition
      });
  });

  // Set timeout to start fade out and remove
  setTimeout(() => {
    // toast.style.opacity = '0'; // REMOVE THIS LINE
    toast.classList.remove('opacity-100'); // Fade out by reverting opacity
    toast.classList.add('opacity-0');

    // Remove after fade out transition (should match duration)
    toast.addEventListener('transitionend', () => {
         // Check if the toast still exists before removing (might have been replaced)
         const currentToast = document.getElementById(toastId);
         // Make sure we are removing the *correct* toast instance in case of rapid toasts
         if (currentToast === toast) {
            currentToast.remove();
         }
    }, { once: true }); // Ensure listener runs only once

  }, 3000); // Start fade-out after 3 seconds
}


// --- Favorites and Recently Used ---

function toggleFavorite(promptId) {
  chrome.storage.local.get(['favorites'], function(result) {
    let favorites = result.favorites || []; // Ensure it's an array
    const index = favorites.indexOf(promptId);
    
    if (index === -1) {
      // Add to favorites
      favorites.push(promptId);
    } else {
      // Remove from favorites
      favorites.splice(index, 1);
    }
    
    chrome.storage.local.set({ favorites }, function() {
      // Refresh the current view to update star icons and counts
      const activeCategoryEl = document.querySelector('#categoriesList > div.bg-blue-100'); // More specific selector
      const activeCategory = activeCategoryEl ? activeCategoryEl.dataset.categoryId : 'all';
      
      // Refresh the prompts list for the potentially new/updated category
      loadPrompts(activeCategory); 
      
      // Refresh categories (for counts)
      loadCategories(); 
      
      // Show success message
      showToast('Prompt updated successfully!');
    });
  });
}

function addToRecentlyUsed(promptId) {
  chrome.storage.local.get(['recentlyUsed', 'corePrompts', 'userPrompts'], function(result) {
    let recentlyUsed = result.recentlyUsed || [];
    
    // Remove if already exists to move it to the front
    recentlyUsed = recentlyUsed.filter(id => id !== promptId);
    
    // Add to the front (most recent)
    recentlyUsed.unshift(promptId);
    
    // Limit to a reasonable number (e.g., 10-15)
    const MAX_RECENT = 15; 
    if (recentlyUsed.length > MAX_RECENT) {
      recentlyUsed = recentlyUsed.slice(0, MAX_RECENT);
    }
    
    const updateData = { recentlyUsed };

    // --- Increment usage count --- 
    let corePrompts = result.corePrompts || [];
    let userPrompts = result.userPrompts || [];
    let promptFoundAndUpdated = false; // Flag to track if update occurred

    // Try updating in corePrompts
    const updatedCorePrompts = corePrompts.map(p => {
        if (p.id === promptId) {
            promptFoundAndUpdated = true; // Set flag if found here
            return { ...p, usageCount: (p.usageCount || 0) + 1, lastUsed: new Date().toISOString() };
        }
        return p;
    });
    
    // If found and updated in core, add updated core prompts to storage update
    if (promptFoundAndUpdated) {
        updateData.corePrompts = updatedCorePrompts;
    } else {
        // If *not* found in core, try updating in userPrompts
        const updatedUserPrompts = userPrompts.map(p => {
            if (p.id === promptId) {
                promptFoundAndUpdated = true; // Set flag if found here
                return { ...p, usageCount: (p.usageCount || 0) + 1, lastUsed: new Date().toISOString() };
            }
            return p;
        });
        // If found and updated in user, add updated user prompts to storage update
        if (promptFoundAndUpdated) {
             updateData.userPrompts = updatedUserPrompts;
        }
    }
    // --- End Usage Count ---

    chrome.storage.local.set(updateData, () => {
        // REMOVED Modal Closing Logic - Handled by the calling copy function

        // Get active category to refresh view intelligently
        const activeEl = document.querySelector('#categoriesList > div.bg-blue-100');
        const activeCategory = activeEl ? activeEl.dataset.categoryId : 'all';
        
        // Refresh the prompts list for the potentially new/updated category
        loadPrompts(activeCategory); 
        
        // Refresh categories (for counts)
        loadCategories(); 
        
        // Show a generic success message (or remove if too noisy)
        // showToast('Prompt usage tracked.'); 
    });
  });
}

// --- New/Edit Prompt Modal ---

// Helper to populate category dropdown in modals
function populateCategoryDropdown(selectElementId, selectedCategoryId = null) {
    const selectEl = document.getElementById(selectElementId);
    if (!selectEl) {
        console.error(`Dropdown element with ID "${selectElementId}" not found.`);
        return;
    }

    chrome.storage.local.get(['userCategories'], function(result) {
        const userCategories = result.userCategories || [];
        // Use CORE_CATEGORIES constant, filter out special ones if they shouldn't be assignable
        const staticCoreCategories = CORE_CATEGORIES; 
        
        const allAssignableCategories = [...staticCoreCategories, ...userCategories]
                                            .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        selectEl.innerHTML = allAssignableCategories.map(cat => 
            `<option value="${cat.id}" ${cat.id === selectedCategoryId ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
        
        // Select the first option if nothing was pre-selected (for 'New Prompt')
        if (!selectedCategoryId && selectEl.options.length > 0) {
             selectEl.selectedIndex = 0;
        }
    });
}


function showNewPromptModal(promptIdToEdit = null) {
  const modalContainer = document.getElementById('newPromptModal');
  if (!modalContainer) return;

  modalContainer.classList.remove('hidden');
  modalContainer.classList.add('visible'); // Add visible class

  const isEditing = promptIdToEdit !== null;
  const modalTitle = isEditing ? 'Edit Prompt' : 'New Prompt';
  const saveButtonText = isEditing ? 'Save Changes' : 'Create Prompt';

  // Fetch prompt data if editing
  if (isEditing) {
      chrome.storage.local.get(['corePrompts', 'userPrompts'], function(result) {
          const allPrompts = [...(result.corePrompts || []), ...(result.userPrompts || [])];
          const prompt = allPrompts.find(p => p.id === promptIdToEdit);
          if (prompt) {
              renderNewEditModalContent(modalContainer, modalTitle, saveButtonText, prompt);
          } else {
              console.error("Prompt not found for editing:", promptIdToEdit);
              showToast("Error: Could not load prompt data.", "error");
              modalContainer.classList.add('hidden');
              modalContainer.classList.remove('visible'); // Remove visible class
          }
      });
  } else {
      // Render for new prompt
      renderNewEditModalContent(modalContainer, modalTitle, saveButtonText, null);
  }
}

// Renders the actual HTML content for the new/edit modal
function renderNewEditModalContent(modalContainer, modalTitle, saveButtonText, promptData = null) {
    const isEditing = promptData !== null;
    const promptId = promptData?.id || '';
    
    // Clean up the text data 
    const title = promptData?.title || '';
    const description = promptData?.description || '';
    const categoryId = promptData?.category || null;
    
    // **Normalize promptText newlines *before* displaying in textarea**
    let rawPromptText = promptData?.promptText || '';
    const normalizedPromptText = rawPromptText.replace(/\\n/g, '\n');
    
    const tags = promptData?.tags || [];

    modalContainer.className = "visible"; // Use visible class

    modalContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg">
      <div class="header">
        <h2 class="text-lg font-medium">${escapeHtml(modalTitle)}</h2>
        <button id="closeNewPromptModal" class="text-gray-400 hover:text-gray-600 p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="content">
        <form id="promptForm" class="space-y-3"> <!-- Increased spacing -->
          <input type="hidden" id="promptId" value="${escapeHtml(promptId)}">
          
          <div>
            <label for="promptTitle" class="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input
              type="text"
              id="promptTitle"
              name="promptTitle"
              placeholder="e.g., Artist Introduction Template"
              class="w-full p-2 border border-gray-300 rounded-md"
              value="${escapeHtml(title)}"
              required
            />
          </div>
          
          <div>
            <label for="promptDescription" class="block text-sm font-medium text-gray-700 mb-1">
              Description <span class="text-gray-500">(Optional, 200 chars max)</span>
            </label>
            <textarea
              id="promptDescription"
              name="promptDescription"
              placeholder="Brief description of when/how to use this prompt"
              class="w-full p-2 border border-gray-300 rounded-md resize-none h-20" 
              maxlength="200"
            >${escapeHtml(description)}</textarea>
            <div class="text-xs text-gray-500 mt-1 text-right">
              <span id="charCount">${description.length}</span>/200
            </div>
          </div>
          
          <div>
            <label for="promptCategory" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="promptCategory" name="promptCategory" class="w-full p-2 border border-gray-300 rounded-md bg-white">
              <!-- Options will be populated by JS -->
              <option value="">Loading categories...</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags <span class="text-gray-500">(Optional)</span></label>
            <div id="tagsContainer" class="flex flex-wrap gap-2 mb-2 p-2 border border-gray-200 rounded-md min-h-[60px]"> <!-- Increased min-height -->
                <!-- Tags added here by JS -->
            </div>
            <input
              type="text"
              id="newTagInput"
              placeholder="Type a tag and press Enter..."
              class="w-full p-2 border border-gray-300 rounded-md"
            />
             <input type="hidden" id="tagsData" name="tagsData" value="${escapeHtml(tags.join(','))}"> 
          </div>
          
          <div>
            <label for="promptText" class="block text-sm font-medium text-gray-700 mb-1">Prompt Text*</label>
            <textarea
              id="promptText"
              name="promptText"
              placeholder="Enter your prompt text here. Use {{variable_name}} syntax for parts that should be customizable."
              class="w-full p-2 border border-gray-300 rounded-md font-mono text-sm resize-y h-36 min-h-[9rem]" 
              required
            >${escapeHtml(normalizedPromptText)}</textarea> <!-- Use normalized text here -->
            <div class="text-xs text-gray-500 mt-1 text-left">
              <span>⟺ Drag bottom edge to resize</span>
            </div>
          </div>
        </form>
      </div>
      
      <div class="footer">
        <button id="cancelNewPrompt" type="button" class="px-4 py-2 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50">
          Cancel
        </button>
        <button id="saveNewPrompt" type="button" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
          ${escapeHtml(saveButtonText)}
        </button>
      </div>
    </div>
  `;

    // --- Setup for the rendered modal ---

    // Populate category dropdown
    populateCategoryDropdown('promptCategory', categoryId);

    // Set up character counter
    const descriptionEl = document.getElementById('promptDescription');
    const charCountEl = document.getElementById('charCount');
    if (descriptionEl && charCountEl) {
        descriptionEl.addEventListener('input', () => {
            charCountEl.textContent = descriptionEl.value.length;
        });
    }

    // Set up tag input
    setupTagInput(tags); // Pass existing tags if editing

    // Add event listeners for buttons
    document.getElementById('closeNewPromptModal').addEventListener('click', () => {
        modalContainer.classList.add('hidden');
        modalContainer.classList.remove('visible'); // Remove visible class
        modalContainer.innerHTML = ''; // Clear content
    });
    document.getElementById('cancelNewPrompt').addEventListener('click', () => {
        modalContainer.classList.add('hidden');
        modalContainer.classList.remove('visible'); // Remove visible class
        modalContainer.innerHTML = ''; // Clear content
    });
    document.getElementById('saveNewPrompt').addEventListener('click', () => savePrompt(isEditing));
    
    // Get the current font size setting and apply it to the modal elements
    chrome.storage.local.get(['settings'], function(result) {
        const settings = result.settings || { fontSize: 'medium' };
        // Re-apply font size to ensure the modal gets proper sizing
        updateElementFontSizes(settings.fontSize || 'medium');
    });
}

// Sets up the tag input functionality (Needs to be called after modal HTML is rendered)
function setupTagInput(initialTags = []) {
    const tagsContainer = document.getElementById('tagsContainer');
    const tagInput = document.getElementById('newTagInput');
    const tagsDataInput = document.getElementById('tagsData'); // Hidden input
    let currentTags = [...initialTags]; // Copy initial tags

    if (!tagsContainer || !tagInput || !tagsDataInput) {
        console.error("Tag elements not found in modal.");
        return;
    }

    function renderTags() {
        tagsContainer.innerHTML = '';
        currentTags.forEach((tag, index) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1';
            tagEl.innerHTML = `
                ${tag}
                <button type="button" class="ml-1 text-blue-400 hover:text-blue-600">×</button>
            `;
            
            tagEl.querySelector('button').addEventListener('click', () => {
                const index = currentTags.indexOf(tag);
                if (index !== -1) {
                    currentTags.splice(index, 1);
                    renderTags();
                }
            });
            
            tagsContainer.appendChild(tagEl);
        });
        // Update hidden input value
        tagsDataInput.value = currentTags.join(',');
    }

    // Initial render of tags if editing
    renderTags();

    // Event listener for tag input (Enter key)
    tagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.value.trim().replace(/,/g, ''); // Remove commas
            if (newTag && !currentTags.includes(newTag)) {
                currentTags.push(newTag);
                renderTags();
            }
            tagInput.value = ''; // Clear the input field
        }
    });

    // Event listeners for suggestion buttons
    document.querySelectorAll('.tag-suggestion').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const tag = this.textContent.trim();
            if (!currentTags.includes(tag)) {
                currentTags.push(tag);
                renderTags();
            }
        });
    });
}


// Saves the prompt (handles both new and edit)
function savePrompt(isEditing) {
    const modalContainer = document.getElementById('newPromptModal');
    const id = document.getElementById('promptId')?.value || null; // Get ID if editing
    const title = document.getElementById('promptTitle')?.value.trim();
    const description = document.getElementById('promptDescription')?.value.trim();
    const category = document.getElementById('promptCategory')?.value;
    const promptText = document.getElementById('promptText')?.value.trim();
    const tags = Array.from(document.querySelectorAll('#tagsContainer > span')).map(el => el.textContent.trim().replace('×', ''));
    
    // Validation
    if (!title) {
        alert('Please enter a title for the prompt.');
        document.getElementById('promptTitle')?.focus();
        return;
    }
    if (!promptText) {
        alert('Please enter the prompt text.');
        document.getElementById('promptText')?.focus();
        return;
    }

    if (isEditing && !id) {
        console.error("Cannot save edit, prompt ID is missing.");
        showToast("Error saving prompt.", "error");
        return;
    }

    // --- Sanitize data before saving ---
    const sanitizedTitle = title.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
    const sanitizedDescription = description.replace(/<\/?[^>]+(>|$)/g, "");
    const sanitizedPromptText = promptText.replace(/<\/?[^>]+(>|$)/g, "");
    const sanitizedTags = tags.map(tag => tag.replace(/<\/?[^>]+(>|$)/g, ""));

    // --- Save Logic ---
    chrome.storage.local.get(['corePrompts', 'userPrompts'], function(result) {
        let corePrompts = result.corePrompts || [];
        let userPrompts = result.userPrompts || [];
        let promptSaved = false;
        let oldCategory = null;

        if (isEditing) {
            // Find and update in either core or user prompts
            let found = false;
            corePrompts = corePrompts.map(p => {
                if (p.id === id) {
                    found = true;
                    oldCategory = p.category; // Store old category for comparison
                    return { 
                        ...p, 
                        title: sanitizedTitle, 
                        description: sanitizedDescription, 
                        category, 
                        promptText: sanitizedPromptText, 
                        tags: sanitizedTags, 
                        lastEdited: new Date().toISOString() 
                    };
                }
                return p;
            });
            if (!found) {
                userPrompts = userPrompts.map(p => {
                    if (p.id === id) {
                        found = true;
                        oldCategory = p.category; // Store old category for comparison
                        return { 
                            ...p, 
                            title: sanitizedTitle, 
                            description: sanitizedDescription, 
                            category, 
                            promptText: sanitizedPromptText, 
                            tags: sanitizedTags, 
                            lastEdited: new Date().toISOString() 
                        };
                    }
                    return p;
                });
            }
            promptSaved = found;

        } else {
            // Create new user prompt object
            const newPrompt = {
                id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                title: sanitizedTitle,
                description: sanitizedDescription,
                category: category || null, // Store null if no category selected
                promptText: sanitizedPromptText,
                tags: sanitizedTags,
                isUserCreated: true,
                usageCount: 0,
                createdAt: new Date().toISOString()
            };
            userPrompts.push(newPrompt);
            promptSaved = true;
        }

        // Save back to storage
        chrome.storage.local.set({ corePrompts, userPrompts }, function() {
            // Close modal
            if(modalContainer) {
                modalContainer.classList.add('hidden');
                modalContainer.classList.remove('visible'); // Remove visible class
                modalContainer.innerHTML = ''; // Clear content
            }

            // Refresh categories to update counts in the sidebar
            loadCategories();
            
            // Refresh the current view with the correct category
            const categoryToLoad = document.querySelector('#categoriesList .bg-blue-100')?.dataset.categoryId || 'all';
            loadPrompts(categoryToLoad);
            
            // Show success message
            showToast(isEditing ? 'Prompt updated successfully!' : 'Prompt created successfully!');
        });
    });
}


// --- Prompt Deletion ---

function deletePrompt(promptId, promptTitle) { // Accept title for confirmation
  // Ask for confirmation before deleting
  if (!confirm(`Are you sure you want to delete "${promptTitle || 'this prompt'}"? This cannot be undone.`)) {
    return;
  }

  chrome.storage.local.get(['userPrompts', 'favorites', 'recentlyUsed'], function(result) { // Fetch favorites and recentlyUsed too
    let userPrompts = result.userPrompts || [];
    let favorites = result.favorites || [];
    let recentlyUsed = result.recentlyUsed || [];

    const initialLength = userPrompts.length;
    // Filter out the prompt to delete (ONLY from userPrompts - core prompts are not deletable this way)
    userPrompts = userPrompts.filter(p => p.id !== promptId);

    // Also remove from favorites if it exists there
    favorites = favorites.filter(favId => favId !== promptId);

    // Also remove from recently used if it exists there
    recentlyUsed = recentlyUsed.filter(recentId => recentId !== promptId);

    if (userPrompts.length < initialLength) { // Check if a user prompt was actually deleted
      // Save back to storage
      chrome.storage.local.set({ userPrompts, favorites, recentlyUsed }, function() { // Save updated favorites and recentlyUsed
        // Get the currently selected category
        const activeEl = document.querySelector('#categoriesList > div.bg-blue-100');
        const activeCategory = activeEl ? activeEl.dataset.categoryId : 'all';
            
        // Refresh categories (for counts) first
        loadCategories(); 
        
        // Refresh the prompt list slightly after to ensure category context is updated
        setTimeout(() => {
           loadPrompts(activeCategory); 
        }, 50); // Small delay might help rendering updates
        
        // Show success message
        showToast('Prompt deleted successfully');
      });
    } else {
      // If it wasn't a user prompt, show an error.
      // (Core prompts shouldn't reach this delete function if UI prevents it)
       showToast('Error: Prompt not found for deletion.', 'error');
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

// Add other functions like search, etc. if they exist...
// function initializeSearch() { ... }

// Helper function to escape HTML special characters
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
