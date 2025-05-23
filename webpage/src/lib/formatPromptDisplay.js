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
    'artist': 'Urban Heat', 'artist_name': 'Urban Heat',
    'band': 'Depeche Mode', 'band_name': 'Depeche Mode',
    'song': 'Shake The Disease', 'song_title': 'Shake The Disease',
    'album': 'Violator', 'album_name': 'Violator',
    'year': '2018', 'release_year': '2025',
    'date': '5/22/25, Friday May 23rd, 5/22, etc.',
    'show_date': '5/22/25, Friday May 23rd, 5/22, etc.',
    'genre': 'goth, synth-wave, indie-rock, etc.',
    'weather': 'Sunny, 75°F', 'condition': 'clear skies',
    'guest': 'Jane Doe', 'guest_name': 'Jane Doe',
    'station': 'KEXP', 'station_call': 'KEXP',
    'show': 'Sounds Like', 'show_name': 'Sounds Like',
    'time': '15 seconds', 'day': 'Friday',
    'location': 'Downtown', 'city': 'Seattle',
    'name': 'Listener Name', 'caller': 'Caller Name',
    'topic': 'short topic or description', 'event': 'Summer Concert',
    'music_genre': 'goth, synth-wave, indie-rock, etc.', 'theme_emotion': 'happy, sad, Christmas, etc.'
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
