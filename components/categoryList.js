// components/categoryList.js
// This file exports a function to create the category list

/**
 * Creates a category list element
 * @param {Array} categories - Array of category objects
 * @param {Function} onSelect - Function to call when a category is selected
 * @returns {HTMLElement} The created list element
 */
export function createCategoryList(categories, onSelect) {
    const list = document.createElement('div');
    list.className = 'space-y-1';
    
    categories.forEach(category => {
      const categoryEl = document.createElement('div');
      categoryEl.className = 'px-2 py-1.5 text-sm rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-100 text-gray-700';
      categoryEl.dataset.categoryId = category.id;
      
      categoryEl.innerHTML = `
        <span>${category.name}</span>
        <span class="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">${category.count}</span>
      `;
      
      categoryEl.addEventListener('click', () => {
        // Highlight selected category
        list.querySelectorAll('div').forEach(el => {
          el.classList.remove('bg-blue-100', 'text-blue-700');
          el.classList.add('text-gray-700');
        });
        categoryEl.classList.add('bg-blue-100', 'text-blue-700');
        categoryEl.classList.remove('text-gray-700');
        
        // Call the callback
        onSelect(category.id);
      });
      
      list.appendChild(categoryEl);
    });
    
    return list;
  }
  
  /**
   * Updates the counts in an existing category list
   * @param {HTMLElement} listElement - The category list element
   * @param {Array} categories - Updated category data
   */
  export function updateCategoryCounts(listElement, categories) {
    categories.forEach(category => {
      const categoryEl = listElement.querySelector(`[data-category-id="${category.id}"]`);
      if (categoryEl) {
        const countEl = categoryEl.querySelector('span:last-child');
        countEl.textContent = category.count;
      }
    });
  }