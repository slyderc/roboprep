import storage from './storage';

/**
 * Imports prompts from a JSON file with duplicate checking
 * @param {File} file - The JSON file to import
 * @param {Function} onSuccess - Callback for success
 * @param {Function} onError - Callback for error
 */
export async function importPromptsWithDuplicateCheck(file, onSuccess, onError) {
  try {
    // Read the file content
    const fileContent = await readFileAsText(file);
    const importData = JSON.parse(fileContent);
    
    // Validate the file format
    if (!importData.type || importData.type !== 'DJPromptsExport' || !importData.prompts) {
      throw new Error('Invalid file format. Expected a DJ Prompts export file.');
    }
    
    // Get existing prompts for duplicate checking
    const { userPrompts = [] } = await storage.get({ userPrompts: [] });
    
    // Track duplicates and successfully imported prompts
    const duplicates = [];
    const newPrompts = [];
    
    // Check each imported prompt for duplicates
    importData.prompts.forEach(importedPrompt => {
      // Check if this prompt is a duplicate
      const isDuplicate = userPrompts.some(existingPrompt => 
        existingPrompt.title === importedPrompt.title &&
        existingPrompt.promptText === importedPrompt.promptText
      );
      
      if (isDuplicate) {
        duplicates.push(importedPrompt);
      } else {
        // Clone the prompt and ensure it has a unique ID
        const newPrompt = {
          ...importedPrompt,
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          isUserCreated: true,
          usageCount: 0,
          createdAt: new Date().toISOString()
        };
        newPrompts.push(newPrompt);
      }
    });
    
    // If there are new prompts, add them to storage
    if (newPrompts.length > 0) {
      const updatedPrompts = [...userPrompts, ...newPrompts];
      await storage.set({ userPrompts: updatedPrompts });
    }
    
    // Call the success callback with results
    onSuccess({ 
      newPromptsCount: newPrompts.length, 
      duplicateCount: duplicates.length 
    });
    
  } catch (error) {
    onError(error);
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

/**
 * Exports user prompts to a JSON file
 * @returns {Promise<void>}
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
    return false;
  }
}