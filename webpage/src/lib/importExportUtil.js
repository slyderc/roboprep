import storage from './storage';
import { showToast } from './toastUtil';

/**
 * Exports user prompts to a JSON file
 * @returns {Promise<boolean>} Success flag
 */
export async function exportPromptData() {
  try {
    const { userPrompts = [] } = await storage.get({ userPrompts: [] });
    
    if (!Array.isArray(userPrompts)) {
      throw new Error('Invalid data format for user prompts');
    }
    
    const exportData = { 
      type: 'DJPromptsExport', 
      version: '1.0', 
      timestamp: new Date().toISOString(), 
      prompts: userPrompts 
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `dj_prompts_export_${new Date().toISOString().split('T')[0]}.json`;
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
 * Imports prompts from a JSON file with validation and duplicate checking
 * @param {File} file - The JSON file to import
 * @returns {Promise<{success: boolean, newPromptsCount: number, duplicateCount: number, error?: string}>} Result object
 */
export async function importPromptData(file) {
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
    
    // Get existing prompts for duplicate checking
    const { userPrompts = [] } = await storage.get({ userPrompts: [] });
    
    // Process prompts for import
    const { newPrompts, duplicates } = await processPromptsForImport(importData.prompts, userPrompts);
    
    // Save the new prompts if there are any
    if (newPrompts.length > 0) {
      const updatedPrompts = [...userPrompts, ...newPrompts];
      await storage.set({ userPrompts: updatedPrompts });
    }
    
    return {
      success: true,
      newPromptsCount: newPrompts.length,
      duplicateCount: duplicates.length
    };
    
  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      newPromptsCount: 0,
      duplicateCount: 0,
      error: error.message
    };
  }
}

/**
 * Processes prompts from an import file, identifying duplicates
 * @param {Array} importedPrompts - Prompts from import file
 * @param {Array} existingPrompts - Existing user prompts
 * @returns {Promise<{newPrompts: Array, duplicates: Array}>} Processed prompts
 */
async function processPromptsForImport(importedPrompts, existingPrompts) {
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
    
    if (isDuplicate) {
      duplicates.push(importedPrompt);
    } else {
      // Generate a new ID but preserve other properties including category
      const newPrompt = {
        ...importedPrompt,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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