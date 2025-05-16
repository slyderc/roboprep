/**
 * Detects variables in a prompt text
 * @param {string} promptText - The prompt text to analyze
 * @returns {string[]} Array of variable names found
 */
export function detectVariables(promptText) {
  if (typeof promptText !== 'string') return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = regex.exec(promptText)) !== null) {
    const varName = match[1].trim();
    if (varName) {
      variables.push(varName);
    }
  }
  
  return [...new Set(variables)]; // Remove duplicates
}

/**
 * Replaces variables in a prompt text with their values
 * @param {string} promptText - The prompt text with variables
 * @param {Object} replacements - Key-value pairs of variable names and their replacements
 * @returns {string} The prompt text with variables replaced
 */
export function replaceVariables(promptText, replacements) {
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

/**
 * Gets a placeholder example based on variable name
 * @param {string} variable - The variable name
 * @returns {string} An example value for the variable
 */
export function getPlaceholderExample(variable) {
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

/**
 * Helper function to escape HTML special characters
 * @param {string} text - The text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}