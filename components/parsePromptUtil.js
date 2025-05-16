// components/parsePromptUtil.js
// This file provides a simple utility function for parsing JSON prompts

/**
 * Parses a JSON string containing a prompt and returns the clean prompt text
 * 
 * @param {string} jsonString - The JSON string containing the prompt
 * @returns {string} Clean prompt text with proper formatting
 * 
 * Example usage:
 * const jsonPrompt = `{ "promptText": "You are an experienced radio DJ..." }`;
 * const cleanPrompt = parsePrompt(jsonPrompt);
 * console.log(cleanPrompt);
 */
export function parsePrompt(jsonString) {
  try {
    // Parse the JSON string
    const data = JSON.parse(jsonString);
    
    // Check if promptText exists
    if (!data.promptText) {
      console.error('No promptText field found in JSON');
      return null;
    }
    
    // Parse the promptText to handle escaped characters
    return data.promptText
      .replace(/\\n/g, '\n') // Convert \n to actual newlines
      .replace(/\\"/g, '"')  // Convert \" to "
      .replace(/\\\\/g, '\\'); // Convert \\ to \
  } catch (error) {
    console.error('Error parsing JSON prompt:', error);
    return null;
  }
}

/**
 * Example function showing how to use the parsed prompt
 * @param {string} jsonString - The JSON string containing the prompt
 * @returns {string} Formatted prompt ready for use
 */
export function preparePromptFromJson(jsonString) {
  const promptText = parsePrompt(jsonString);
  
  if (!promptText) {
    return 'Error: Could not parse prompt from JSON';
  }
  
  // Return the clean prompt text
  return promptText;
} 