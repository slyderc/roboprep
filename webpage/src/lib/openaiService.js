import { detectVariables, replaceVariables } from './formatPromptDisplay';

/**
 * Submits a prompt to OpenAI's API and returns the response
 * @param {string} promptText - The prompt text to send to OpenAI
 * @param {Object} variables - Key-value pairs of variables to replace in the prompt
 * @returns {Promise<Object>} The API response with formatted content
 */
export async function submitToOpenAI(promptText, variables = {}) {
  try {
    // Prepare the prompt by replacing variables if needed
    const processedPrompt = replaceVariables(promptText, variables);
    
    // API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please check your environment settings.');
    }
    
    // Build the request body
    const requestBody = {
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI assistant helping radio DJs create show content.' },
        { role: 'user', content: processedPrompt }
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2048,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    };
    
    // Make the API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    // Parse the response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      responseText: data.choices[0]?.message?.content || '',
      modelUsed: data.model,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(error.message || 'Failed to get response from OpenAI');
  }
}

/**
 * Helper function to identify retry-able errors
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retry-able
 */
export function isRetryableError(error) {
  return (
    error.message.includes('rate limit') ||
    error.message.includes('timeout') ||
    error.message.includes('503') ||
    error.message.includes('429')
  );
}

/**
 * Submits a prompt to OpenAI with retry logic for handling rate limits
 * @param {string} promptText - The prompt to send
 * @param {Object} variables - Variables to replace in the prompt
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelay - Initial delay in ms before retrying
 * @returns {Promise<Object>} The API response with formatted content
 */
export async function submitWithRetry(promptText, variables = {}, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      return await submitToOpenAI(promptText, variables);
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for the next retry
    }
  }
}