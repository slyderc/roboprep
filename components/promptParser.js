// components/promptParser.js
// This file exports functions to handle parsing imported JSON prompts

/**
 * Parses a JSON prompt and returns a cleaned version ready for use
 * @param {string} jsonString - The raw JSON string containing the prompt
 * @returns {Object} Parsed prompt object with cleaned text
 */
export function parseJsonPrompt(jsonString) {
  try {
    // Parse the JSON string
    const promptData = JSON.parse(jsonString);
    
    // Extract the promptText field
    if (!promptData.promptText) {
      throw new Error('No promptText field found in JSON');
    }
    
    // Return a cleaned prompt object
    return {
      promptText: promptData.promptText,
      // Any other fields that might be in the JSON
      title: promptData.title || 'Imported Prompt',
      description: promptData.description || 'Imported from JSON',
      category: promptData.category || 'imported',
      tags: promptData.tags || ['imported']
    };
  } catch (error) {
    console.error('Error parsing JSON prompt:', error);
    return null;
  }
}

/**
 * Cleans imported prompt text to remove unnecessary escapes
 * @param {string} promptText - The raw prompt text from JSON
 * @returns {string} Cleaned prompt text
 */
export function cleanPromptText(promptText) {
  if (!promptText) return '';
  
  // Handle escaped characters in the JSON string
  return promptText
    .replace(/\\n/g, '\n')  // Replace \n with actual line breaks
    .replace(/\\"/g, '"')   // Replace \" with "
    .replace(/\\\\/g, '\\'); // Replace \\ with \
}

/**
 * Processes an imported JSON prompt file and returns ready-to-use prompt data
 * @param {string} fileContent - The content of the JSON file
 * @returns {Array} Array of parsed prompt objects
 */
export function processImportedPrompts(fileContent) {
  try {
    // Try parsing as a JSON array first
    let promptData;
    try {
      promptData = JSON.parse(fileContent);
    } catch (e) {
      // If that fails, try wrapping in square brackets and parsing again
      // This handles single prompt objects
      promptData = JSON.parse(`[${fileContent}]`);
    }
    
    // Handle both array and single object formats
    const promptArray = Array.isArray(promptData) ? promptData : [promptData];
    
    // Process each prompt object
    return promptArray.map(prompt => {
      if (prompt.promptText) {
        prompt.promptText = cleanPromptText(prompt.promptText);
      }
      return prompt;
    });
  } catch (error) {
    console.error('Error processing imported prompts:', error);
    return [];
  }
}

/**
 * Renders a clean prompt block from JSON for use in the extension
 * @param {string} jsonString - The raw JSON string
 * @returns {string} Clean prompt text ready for use
 */
export function renderPromptFromJson(jsonString) {
  const parsedPrompt = parseJsonPrompt(jsonString);
  if (!parsedPrompt) {
    return 'Error: Unable to parse prompt from JSON';
  }
  
  return cleanPromptText(parsedPrompt.promptText);
} 