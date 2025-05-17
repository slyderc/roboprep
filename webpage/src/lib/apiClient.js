/**
 * Client-side API wrapper for communicating with the backend API routes
 */

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