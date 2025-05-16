// components/newPromptModal.js
// This file exports a function to create the new prompt modal

/**
 * Creates a new prompt modal
 * @param {Object} [prompt] - Existing prompt for editing (optional)
 * @param {Function} onCancel - Function to call when canceled
 * @param {Function} onSave - Function to call when saved with new prompt data
 * @returns {HTMLElement} The modal element
 */
export function createNewPromptModal(prompt, onCancel, onSave) {
    const isEditing = !!prompt;
    const modalTitle = isEditing ? 'Edit Prompt' : 'New Prompt';
    const buttonText = isEditing ? 'Save Changes' : 'Create Prompt';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const folders = [
      { id: 'artist-bio', name: 'Artist Bio' },
      { id: 'song-story', name: 'Song Story' },
      { id: 'show-segments', name: 'Show Segments' },
      { id: 'music-trivia', name: 'Music Trivia' },
      { id: 'interviews', name: 'Interviews' },
      { id: 'weather', name: 'Weather' },
      { id: 'contests', name: 'Contests' },
    ];
    
    const folderOptions = folders.map(folder => 
      `<option value="${folder.id}" ${isEditing && prompt.category === folder.id ? 'selected' : ''}>${folder.name}</option>`
    ).join('');
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div class="p-3 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-medium">${modalTitle}</h2>
          <button id="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="p-4 max-h-[70vh] overflow-y-auto">
          <form id="promptForm">
            ${isEditing ? `<input type="hidden" id="promptId" value="${prompt.id}">` : ''}
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    id="promptTitle"
                    placeholder="e.g., Artist Introduction Template"
                    class="w-full p-2 border border-gray-300 rounded-md"
                    value="${isEditing ? prompt.title : ''}"
                    required
                  />
                </div>
                
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Description (200 characters max)
                  </label>
                  <textarea
                    id="promptDescription"
                    placeholder="Brief description of when/how to use this prompt"
                    class="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                    maxlength="200"
                  >${isEditing ? prompt.description : ''}</textarea>
                  <div class="text-xs text-gray-500 mt-1 text-right">
                    <span id="charCount">${isEditing ? prompt.description.length : '0'}</span>/200
                  </div>
                </div>
                
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select id="promptCategory" class="w-full p-2 border border-gray-300 rounded-md" required>
                    ${folderOptions}
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div id="tagsContainer" class="flex flex-wrap gap-2 mb-2">
                    ${isEditing && prompt.tags ? prompt.tags.map(tag => `
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${tag}
                        <button type="button" class="ml-1 text-blue-400 hover:text-blue-600 tag-remove" data-tag="${tag}">×</button>
                      </span>
                    `).join('') : ''}
                  </div>
                  <input
                    type="text"
                    id="tagInput"
                    placeholder="Enter tags (press Enter to add)"
                    class="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <input type="hidden" id="promptTags" value="${isEditing && prompt.tags ? prompt.tags.join(',') : ''}" />
                  <div class="mt-2">
                    <span class="text-xs text-gray-500 mr-2">Popular:</span>
                    <button type="button" class="tag-suggestion inline-block mr-2 mb-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200">Morning Show</button>
                    <button type="button" class="tag-suggestion inline-block mr-2 mb-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200">Drive Time</button>
                    <button type="button" class="tag-suggestion inline-block mr-2 mb-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200">Call-in</button>
                    <button type="button" class="tag-suggestion inline-block mr-2 mb-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200">Live</button>
                    <button type="button" class="tag-suggestion inline-block mr-2 mb-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200">Music</button>
                  </div>
                </div>
              </div>
              
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label class="block text-sm font-medium text-gray-700">Prompt Text</label>
                  <div class="text-xs text-blue-600 flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Use {{variable_name}} for variables</span>
                  </div>
                </div>
                <textarea
                  id="promptText"
                  placeholder="Enter your prompt text here. Use {{variable_name}} syntax for parts that should be customizable."
                  class="w-full p-2 border border-gray-300 rounded-md h-52 font-mono text-sm"
                  required
                >${isEditing ? prompt.promptText : ''}</textarea>
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm text-yellow-700">
                        Variables will be automatically detected. DJs will be prompted to fill them in when using this prompt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div class="p-3 border-t border-gray-200 flex justify-end gap-2">
          <button id="cancelBtn" class="px-3 py-1.5 text-sm text-gray-600 rounded-md border border-gray-300">
            Cancel
          </button>
          <button id="saveBtn" class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md">
            ${buttonText}
          </button>
        </div>
      </div>
    `;
    
    // Attach event handlers after the modal is added to the DOM
    setTimeout(() => {
      // Handle character counter for description
      const description = modal.querySelector('#promptDescription');
      const charCount = modal.querySelector('#charCount');
      
      description.addEventListener('input', function() {
        charCount.textContent = this.value.length;
      });
      
      // Handle tags
      const tagInput = modal.querySelector('#tagInput');
      const tagsContainer = modal.querySelector('#tagsContainer');
      const promptTagsInput = modal.querySelector('#promptTags');
      
      function getTags() {
        return promptTagsInput.value ? promptTagsInput.value.split(',') : [];
      }
      
      function setTags(tags) {
        promptTagsInput.value = tags.join(',');
      }
      
      function renderTags() {
        const tags = getTags();
        tagsContainer.innerHTML = '';
        
        tags.forEach(tag => {
          const tagEl = document.createElement('span');
          tagEl.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
          tagEl.innerHTML = `
            ${tag}
            <button type="button" class="ml-1 text-blue-400 hover:text-blue-600 tag-remove" data-tag="${tag}">×</button>
          `;
          
          tagEl.querySelector('.tag-remove').addEventListener('click', function() {
            const tagToRemove = this.getAttribute('data-tag');
            const updatedTags = getTags().filter(t => t !== tagToRemove);
            setTags(updatedTags);
            renderTags();
          });
          
          tagsContainer.appendChild(tagEl);
        });
      }
      
      tagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
          e.preventDefault();
          const newTag = this.value.trim();
          const currentTags = getTags();
          if (!currentTags.includes(newTag)) {
            currentTags.push(newTag);
            setTags(currentTags);
            renderTags();
          }
          this.value = '';
        }
      });
      
      // Tag suggestions
      modal.querySelectorAll('.tag-suggestion').forEach(btn => {
        btn.addEventListener('click', function() {
          const newTag = this.textContent.trim();
          const currentTags = getTags();
          if (!currentTags.includes(newTag)) {
            currentTags.push(newTag);
            setTags(currentTags);
            renderTags();
          }
        });
      });
      
      // Close modal
      modal.querySelector('#closeModal').addEventListener('click', onCancel);
      modal.querySelector('#cancelBtn').addEventListener('click', onCancel);
      
      // Save prompt
      modal.querySelector('#saveBtn').addEventListener('click', function() {
        const form = modal.querySelector('#promptForm');
        
        // Basic validation
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        
        const promptData = {
          title: modal.querySelector('#promptTitle').value.trim(),
          description: modal.querySelector('#promptDescription').value.trim(),
          category: modal.querySelector('#promptCategory').value,
          tags: getTags(),
          promptText: modal.querySelector('#promptText').value.trim()
        };
        
        if (isEditing) {
          promptData.id = modal.querySelector('#promptId').value;
        }
        
        onSave(promptData);
      });
      
      // If we're editing, handle existing tag removals
      if (isEditing) {
        modal.querySelectorAll('.tag-remove').forEach(btn => {
          btn.addEventListener('click', function() {
            const tagToRemove = this.getAttribute('data-tag');
            const updatedTags = getTags().filter(t => t !== tagToRemove);
            setTags(updatedTags);
            renderTags();
          });
        });
      }
    }, 0);
    
    return modal;
  }