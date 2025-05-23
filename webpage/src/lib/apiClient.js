/**
 * Client-side API wrapper for communicating with the backend API routes
 */

/**
 * Sends a request to the database API
 * @param {string} operation - The operation to perform
 * @param {Object} params - The parameters for the operation
 * @returns {Promise<Object>} The API response
 */
export async function dbApiRequest(operation, params = {}) {
  try {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ operation, params })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('DB API request error:', error);
    throw error;
  }
}

/**
 * Gets database statistics
 * @returns {Promise<Object>} Object containing counts of records in various tables
 */
export async function getDbStats() {
  return dbApiRequest('getDbStats');
}

/**
 * Sends a prompt to the OpenAI API via Next.js API route
 * @param {string} promptText - The prompt text to send
 * @param {Object} variables - Variables to replace in the prompt
 * @returns {Promise<Object>} The API response
 */
export async function sendPromptToOpenAI(promptText, variables = {}) {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ promptText, variables })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}