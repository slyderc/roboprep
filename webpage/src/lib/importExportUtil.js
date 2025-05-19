import storage from './storage';
import { showToast } from './toastUtil';
import { fetchWithErrorHandling } from './apiErrorHandler';

/**
 * Exports user prompts and responses to a JSON file
 * @param {boolean} includeResponses - Whether to include AI responses in the export
 * @returns {Promise<boolean>} Success flag
 */
export async function exportPromptData(includeResponses = true) {
  try {
    const data = await storage.get({
      userPrompts: [],
      userCategories: [],
      aiResponses: []
    });
    
    if (!Array.isArray(data.userPrompts)) {
      throw new Error('Invalid data format for user prompts');
    }
    
    const exportData = { 
      type: 'DJPromptsExport', 
      version: '2.0', 
      timestamp: new Date().toISOString(), 
      prompts: data.userPrompts,
      categories: data.userCategories
    };
    
    // Only include responses if requested
    if (includeResponses && Array.isArray(data.aiResponses)) {
      exportData.responses = data.aiResponses;
    }
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `roboprep_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    showToast('Export failed: ' + error.message, 'error');
    return false;
  }
}

/**
 * Imports prompts and responses from a JSON file with validation and duplicate checking
 * @param {File} file - The JSON file to import
 * @param {Object} options - Import options
 * @param {boolean} options.skipDuplicates - Whether to skip duplicates when importing
 * @param {boolean} options.includeResponses - Whether to import responses
 * @returns {Promise<{success: boolean, newPromptsCount: number, duplicateCount: number, responsesCount: number, error?: string}>} Result object
 */
export async function importPromptData(file, options = { skipDuplicates: true, includeResponses: true }) {
  try {
    console.log('Starting import with options:', options);
    
    // Read the file
    const fileContent = await readFileAsText(file);
    console.log(`Read file content, size: ${fileContent.length} bytes`);
    
    // Parse JSON
    let importData;
    try {
      importData = JSON.parse(fileContent);
    } catch (err) {
      throw new Error('The selected file is not a valid JSON file');
    }
    
    // Validate file format
    if (!importData || typeof importData !== 'object') {
      throw new Error('Invalid import file format');
    }
    
    // Check for required fields
    if (importData.type !== 'DJPromptsExport') {
      throw new Error('This is not a valid DJ Prompts export file');
    }
    
    if (!Array.isArray(importData.prompts)) {
      throw new Error('Import file does not contain valid prompts data');
    }
    
    console.log(`Import file contains ${importData.prompts.length} prompts`);
    
    // Process categories first, as prompts may reference them
    let categoryMap = new Map();
    if (importData.categories && Array.isArray(importData.categories)) {
      console.log(`Import file contains ${importData.categories.length} categories`);
      
      // Get existing categories
      const currentCategories = await storage.get({ userCategories: [] });
      console.log(`Found ${currentCategories.userCategories.length} existing categories`);
      
      // Process categories for import
      const categoryResult = await processCategoriesForImport(
        importData.categories,
        currentCategories.userCategories,
        options.skipDuplicates
      );
      
      // Store the category mapping for prompt processing
      categoryMap = categoryResult.categoryMap;
      importStats.categories.imported = categoryResult.newCategories.length;
      importStats.categories.skipped = categoryResult.duplicates.length;
      
      console.log(`Category processing complete: ${categoryResult.newCategories.length} added, ${categoryResult.duplicates.length} skipped`);
    }
    
    // Now get updated categories and other current data for prompt processing
    const currentData = await storage.get({
      userPrompts: [],
      userCategories: [],
      aiResponses: []
    });
    
    console.log(`Found ${currentData.userCategories.length} categories after category import`);
    console.log(`Found ${currentData.userPrompts.length} existing prompts`);
    
    // Initialize import statistics
    const importStats = {
      prompts: { total: 0, imported: 0, skipped: 0 },
      categories: { total: importData.categories?.length || 0, imported: 0, skipped: 0 },
      responses: { total: 0, imported: 0, skipped: 0 }
    };
    
    // Process prompts for import
    const { newPrompts, duplicates } = await processPromptsForImport(
      importData.prompts, 
      currentData.userPrompts,
      options.skipDuplicates,
      categoryMap
    );
    
    importStats.prompts.total = importData.prompts.length;
    importStats.prompts.imported = newPrompts.length;
    importStats.prompts.skipped = duplicates.length;
    
    console.log(`Processed prompts: ${newPrompts.length} new, ${duplicates.length} duplicates`);
    
    // Save the new prompts if there are any
    if (newPrompts.length > 0) {
      console.log('Adding new prompts to database...');
      // Use the addUserPrompts operation instead of replacing all
      await fetchWithErrorHandling('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          operation: 'addUserPrompts', 
          params: { prompts: newPrompts } 
        }),
      }, 'addUserPrompts');
    }
    
    // Process responses if available and import is enabled
    if (options.includeResponses && importData.responses && Array.isArray(importData.responses)) {
      console.log(`Import file contains ${importData.responses.length} responses`);
      await processResponsesForImport(
        importData.responses,
        currentData.aiResponses,
        options.skipDuplicates,
        importStats
      );
    }
    
    // Force a direct update of the context data by directly getting data
    // This bypasses any caching and ensures the UI has the latest data
    const updatedPrompts = await fetchWithErrorHandling('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'getUserPrompts', 
        params: {} 
      }),
    }, 'getUserPrompts');
    
    console.log(`Fetched ${updatedPrompts.length} prompts after import complete`);
    
    // Force store the updated prompts to storage cache
    await storage.set({ userPrompts: updatedPrompts });
    
    return {
      success: true,
      newPromptsCount: importStats.prompts.imported,
      duplicateCount: importStats.prompts.skipped,
      responsesCount: importStats.responses.imported
    };
    
  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      newPromptsCount: 0,
      duplicateCount: 0,
      responsesCount: 0,
      error: error.message
    };
  }
}

/**
 * Processes prompts from an import file, identifying duplicates
 * @param {Array} importedPrompts - Prompts from import file
 * @param {Array} existingPrompts - Existing user prompts
 * @param {boolean} skipDuplicates - Whether to skip duplicates
 * @param {Map} categoryMap - Mapping from old category IDs to new category IDs
 * @returns {Promise<{newPrompts: Array, duplicates: Array}>} Processed prompts
 */
async function processPromptsForImport(importedPrompts, existingPrompts, skipDuplicates, categoryMap = new Map()) {
  console.log(`Processing ${importedPrompts.length} prompts for import`);
  console.log(`Category map contains ${categoryMap.size} mappings`);
  
  const newPrompts = [];
  const duplicates = [];
  
  // Validate and process each imported prompt
  for (const importedPrompt of importedPrompts) {
    // Basic validation of prompt structure
    if (!importedPrompt.title || !importedPrompt.promptText) {
      console.warn('Skipping invalid prompt:', importedPrompt);
      continue;
    }
    
    // Check for duplicates by title and promptText
    const isDuplicate = existingPrompts.some(existingPrompt => 
      existingPrompt.title === importedPrompt.title &&
      existingPrompt.promptText === importedPrompt.promptText
    );
    
    if (isDuplicate && skipDuplicates) {
      console.log(`Skipping duplicate prompt: ${importedPrompt.title}`);
      duplicates.push(importedPrompt);
    } else {
      // Map the category ID if it exists and has a mapping
      let category = importedPrompt.category || '';
      if (category && categoryMap.has(category)) {
        category = categoryMap.get(category);
        console.log(`Mapped category from ${importedPrompt.category} to ${category} for prompt: ${importedPrompt.title}`);
      }
      
      // Generate a new ID but preserve other properties including the mapped category
      const newPrompt = {
        ...importedPrompt,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        isUserCreated: true,
        // Update category to the mapped value if available
        category: category,
        // Ensure other properties have defaults
        usageCount: importedPrompt.usageCount || 0,
        createdAt: importedPrompt.createdAt || new Date().toISOString()
      };
      
      console.log(`Adding prompt for import: ${newPrompt.title} (Category: ${newPrompt.category})`);
      newPrompts.push(newPrompt);
    }
  }
  
  console.log(`Prompt processing complete: ${newPrompts.length} to import, ${duplicates.length} duplicates`);
  return { newPrompts, duplicates };
}

/**
 * Process categories for import
 * @param {Array} importedCategories - Categories from import file
 * @param {Array} existingCategories - Existing user categories
 * @param {boolean} skipDuplicates - Whether to skip duplicates
 * @returns {Promise<{categoryMap: Map, newCategories: Array, duplicates: Array}>} Processed categories
 */
async function processCategoriesForImport(importedCategories, existingCategories, skipDuplicates) {
  console.log(`Processing ${importedCategories.length} categories for import`);
  
  // Get a map of existing category IDs and names for duplicate checking
  const existingCategoryMap = new Map();
  existingCategories.forEach(cat => {
    existingCategoryMap.set(cat.id, cat.name);
    existingCategoryMap.set(cat.name.toLowerCase(), cat.id);
  });
  
  // Process each category
  const categoriesToImport = [];
  const duplicates = [];
  const oldToNewCategoryIdMap = new Map(); // Map old IDs to new IDs for prompt reference
  
  for (const category of importedCategories) {
    // Skip categories without required fields
    if (!category.id || !category.name) {
      console.log(`Skipping invalid category: ${JSON.stringify(category)}`);
      continue;
    }
    
    const originalId = category.id;
    
    // Check if a category with this name already exists
    const duplicateByName = existingCategories.find(
      cat => cat.name.toLowerCase() === category.name.toLowerCase()
    );
    
    // Skip duplicates if option is set
    if (skipDuplicates && duplicateByName) {
      console.log(`Skipping duplicate category by name: ${category.name}`);
      duplicates.push(category);
      
      // Map the old ID to the existing category ID for prompt references
      oldToNewCategoryIdMap.set(originalId, duplicateByName.id);
      continue;
    }
    
    // Add to import list with a new ID
    const newId = `user_cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Store the mapping from old to new ID
    oldToNewCategoryIdMap.set(originalId, newId);
    
    const newCategory = {
      ...category,
      id: newId,
      isUserCreated: true
    };
    
    categoriesToImport.push(newCategory);
    console.log(`Category to import: ${newCategory.name} (${newCategory.id})`);
  }
  
  // Update storage with imported categories
  if (categoriesToImport.length > 0) {
    console.log(`Adding ${categoriesToImport.length} new categories to database...`);
    
    // Use the addUserCategories operation instead of replacing all
    await fetchWithErrorHandling('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'addUserCategories', 
        params: { categories: categoriesToImport } 
      }),
    }, 'addUserCategories');
  }
  
  return { 
    categoryMap: oldToNewCategoryIdMap, 
    newCategories: categoriesToImport,
    duplicates
  };
}

/**
 * Process responses for import
 * @param {Array} importedResponses - Responses from import file
 * @param {Array} existingResponses - Existing responses
 * @param {boolean} skipDuplicates - Whether to skip duplicates
 * @param {Object} importStats - Import statistics to update
 * @returns {Promise<void>}
 */
async function processResponsesForImport(importedResponses, existingResponses, skipDuplicates, importStats) {
  importStats.responses.total = importedResponses.length;
  
  // Get a map of existing response IDs for duplicate checking
  const existingResponseIds = new Set(existingResponses.map(r => r.id));
  
  // Process each response
  const responsesToImport = [];
  
  for (const response of importedResponses) {
    // Skip responses without required fields
    if (!response.id || !response.promptId || !response.responseText) {
      importStats.responses.skipped++;
      continue;
    }
    
    // Skip duplicates if option is set
    if (skipDuplicates && existingResponseIds.has(response.id)) {
      importStats.responses.skipped++;
      continue;
    }
    
    // Check if the prompt exists (using API)
    const checkResult = await fetchWithErrorHandling('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'checkPromptExists', 
        params: { promptId: response.promptId } 
      }),
    }, 'checkPromptExists', false);
    
    if (!checkResult.exists) {
      importStats.responses.skipped++;
      continue;
    }
    
    // Add to import list with a new ID
    responsesToImport.push({
      ...response,
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: response.createdAt || new Date().toISOString()
    });
    importStats.responses.imported++;
  }
  
  // Update storage with imported responses
  if (responsesToImport.length > 0) {
    // Use the addResponses operation instead of replacing all
    await fetchWithErrorHandling('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'addResponses', 
        params: { responses: responsesToImport } 
      }),
    }, 'addResponses');
  }
}

/**
 * Reads a file as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} The file content as text
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}