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
    // Read the file
    const fileContent = await readFileAsText(file);
    
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
    
    // Get existing data for duplicate checking
    const currentData = await storage.get({
      userPrompts: [],
      userCategories: [],
      aiResponses: []
    });
    
    // Initialize import statistics
    const importStats = {
      prompts: { total: 0, imported: 0, skipped: 0 },
      categories: { total: 0, imported: 0, skipped: 0 },
      responses: { total: 0, imported: 0, skipped: 0 }
    };
    
    // Process prompts for import
    const { newPrompts, duplicates } = await processPromptsForImport(
      importData.prompts, 
      currentData.userPrompts,
      options.skipDuplicates
    );
    
    importStats.prompts.total = importData.prompts.length;
    importStats.prompts.imported = newPrompts.length;
    importStats.prompts.skipped = duplicates.length;
    
    // Save the new prompts if there are any
    if (newPrompts.length > 0) {
      const updatedPrompts = [...currentData.userPrompts, ...newPrompts];
      await storage.set({ userPrompts: updatedPrompts });
    }
    
    // Process categories if available
    if (importData.categories && Array.isArray(importData.categories)) {
      await processCategoriesForImport(
        importData.categories,
        currentData.userCategories,
        options.skipDuplicates,
        importStats
      );
    }
    
    // Process responses if available and import is enabled
    if (options.includeResponses && importData.responses && Array.isArray(importData.responses)) {
      await processResponsesForImport(
        importData.responses,
        currentData.aiResponses,
        options.skipDuplicates,
        importStats
      );
    }
    
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
 * @returns {Promise<{newPrompts: Array, duplicates: Array}>} Processed prompts
 */
async function processPromptsForImport(importedPrompts, existingPrompts, skipDuplicates) {
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
      duplicates.push(importedPrompt);
    } else {
      // Generate a new ID but preserve other properties including category
      const newPrompt = {
        ...importedPrompt,
        id: isDuplicate ? importedPrompt.id : `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        isUserCreated: true,
        // Make sure category is preserved
        category: importedPrompt.category || '',
        // Ensure other properties have defaults
        usageCount: importedPrompt.usageCount || 0,
        createdAt: importedPrompt.createdAt || new Date().toISOString()
      };
      
      newPrompts.push(newPrompt);
    }
  }
  
  return { newPrompts, duplicates };
}

/**
 * Process categories for import
 * @param {Array} importedCategories - Categories from import file
 * @param {Array} existingCategories - Existing user categories
 * @param {boolean} skipDuplicates - Whether to skip duplicates
 * @param {Object} importStats - Import statistics to update
 * @returns {Promise<void>}
 */
async function processCategoriesForImport(importedCategories, existingCategories, skipDuplicates, importStats) {
  importStats.categories.total = importedCategories.length;
  
  // Get a map of existing category IDs and names for duplicate checking
  const existingCategoryMap = new Map();
  existingCategories.forEach(cat => {
    existingCategoryMap.set(cat.id, cat.name);
    existingCategoryMap.set(cat.name.toLowerCase(), cat.id);
  });
  
  // Process each category
  const categoriesToImport = [];
  
  for (const category of importedCategories) {
    // Skip categories without required fields
    if (!category.id || !category.name) {
      importStats.categories.skipped++;
      continue;
    }
    
    // Skip duplicates if option is set
    if (skipDuplicates && (
      existingCategoryMap.has(category.id) || 
      existingCategoryMap.has(category.name.toLowerCase())
    )) {
      importStats.categories.skipped++;
      continue;
    }
    
    // Add to import list with a new ID
    categoriesToImport.push({
      ...category,
      id: `user_cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      isUserCreated: true
    });
    importStats.categories.imported++;
  }
  
  // Update storage with imported categories
  if (categoriesToImport.length > 0) {
    const updatedCategories = [...existingCategories, ...categoriesToImport];
    await storage.set({ userCategories: updatedCategories });
  }
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
    const checkPromptParams = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'checkPromptExists', 
        params: { promptId: response.promptId } 
      }),
    };
    
    try {
      const checkResult = await fetch('/api/db', checkPromptParams);
      const { exists } = await checkResult.json();
      
      if (!exists) {
        importStats.responses.skipped++;
        continue;
      }
    } catch (error) {
      // If we can't check, assume the prompt exists and continue
      console.warn(`Couldn't verify prompt ${response.promptId} exists:`, error);
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
    const updatedResponses = [...existingResponses, ...responsesToImport];
    await storage.set({ aiResponses: updatedResponses });
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