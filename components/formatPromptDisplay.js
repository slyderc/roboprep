// components/formatPromptDisplay.js
// Utility function to format prompts for display in the library

/**
 * Formats a prompt for display in the prompt library
 * This function converts escaped characters to their display equivalents
 * 
 * @param {string} promptText - The raw prompt text (possibly with escape sequences)
 * @returns {string} Properly formatted prompt text for display
 */
export function formatPromptForDisplay(promptText) {
  if (!promptText) return '';
  
  // Replace escaped characters with their actual characters
  return promptText
    .replace(/\\n/g, '\n')        // Convert \n to actual newlines
    .replace(/\\"/g, '"')         // Convert \" to "
    .replace(/\\\\/g, '\\')       // Convert \\ to \
    .replace(/\\t/g, '\t');       // Convert \t to tabs
}

/**
 * Formats a JSON prompt string for display in the library
 * 
 * @param {string} jsonString - The JSON string containing the prompt
 * @returns {string} Properly formatted prompt text for display
 */
export function formatJsonPromptForDisplay(jsonString) {
  try {
    // Try parsing the JSON
    const promptData = JSON.parse(jsonString);
    
    // Get the promptText field
    if (promptData && promptData.promptText) {
      return formatPromptForDisplay(promptData.promptText);
    } else {
      return "Error: No promptText field in JSON";
    }
  } catch (error) {
    // If it's not valid JSON, try to clean it directly
    // This handles cases where the promptText has already been extracted
    return formatPromptForDisplay(jsonString);
  }
} 