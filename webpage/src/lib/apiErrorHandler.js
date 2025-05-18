/**
 * API error handling utilities
 * Provides consistent error handling for database API requests
 */
import { showToast } from './toastUtil';

// Error response types with friendly messages
const ERROR_MESSAGES = {
  400: 'The request was invalid. Please try again.',
  401: 'You need to be authenticated to perform this action.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The data may have been modified by another user.',
  500: 'A server error occurred. Please try again later.',
  503: 'The service is currently unavailable. Please try again later.',
  DEFAULT: 'An unexpected error occurred. Please try again.'
};

/**
 * Process API error and show appropriate toast notification
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed
 * @param {boolean} showToastNotification - Whether to show a toast notification
 * @returns {string} - Error message for logging
 */
export function handleApiError(error, operation, showToastNotification = true) {
  // Extract status code and error message if available
  let statusCode = 0;
  let errorMessage = error.message || ERROR_MESSAGES.DEFAULT;
  
  if (error.response) {
    statusCode = error.response.status;
    errorMessage = error.response.data?.error || ERROR_MESSAGES[statusCode] || ERROR_MESSAGES.DEFAULT;
  }
  
  // Create a detailed error message for logging
  const detailedError = `API Error (${operation}): ${errorMessage}`;
  console.error(detailedError, error);
  
  // Show toast notification if requested
  if (showToastNotification) {
    const friendlyMessage = getFriendlyErrorMessage(statusCode, operation);
    showToast(friendlyMessage, 'error');
  }
  
  return detailedError;
}

/**
 * Get a user-friendly error message based on status code and operation
 * @param {number} statusCode - HTTP status code
 * @param {string} operation - The operation that failed
 * @returns {string} - User-friendly error message
 */
function getFriendlyErrorMessage(statusCode, operation) {
  // Generic operation descriptions
  const operationDescriptions = {
    'getSetting': 'retrieving settings',
    'getSettings': 'retrieving settings',
    'setSetting': 'saving settings',
    'removeSetting': 'removing settings',
    'getUserPrompts': 'retrieving your prompts',
    'getCorePrompts': 'retrieving core prompts',
    'storeUserPrompts': 'saving your prompts',
    'storeCorePrompts': 'updating core prompts',
    'getFavorites': 'retrieving your favorites',
    'storeFavorites': 'updating your favorites',
    'getRecentlyUsed': 'retrieving recently used prompts',
    'storeRecentlyUsed': 'updating recently used prompts',
    'getUserCategories': 'retrieving your categories',
    'storeUserCategories': 'updating your categories',
    'getResponses': 'retrieving AI responses',
    'getResponsesForPrompt': 'retrieving AI responses',
    'saveResponse': 'saving AI response',
    'deleteResponse': 'deleting AI response',
    'countResponsesForPrompt': 'counting AI responses',
    'storeResponses': 'saving AI responses',
    'clearData': 'clearing data'
  };
  
  // Get operation description
  const operationDesc = operationDescriptions[operation] || 'performing that action';
  
  // Base message for all errors
  const baseMessage = `Error while ${operationDesc}.`;
  
  // Get specific message based on status code
  const specificMessage = ERROR_MESSAGES[statusCode] || ERROR_MESSAGES.DEFAULT;
  
  return `${baseMessage} ${specificMessage}`;
}

/**
 * Wrapper for fetch API with error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {string} operation - Operation name for error reporting
 * @param {boolean} showToastOnError - Whether to show toast on error
 * @returns {Promise<any>} - API response data
 */
export async function fetchWithErrorHandling(url, options, operation, showToastOnError = true) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to parse error details from response
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, create a basic error object
        errorData = { error: 'Unknown error' };
      }
      
      // Create an error object with response details
      const error = new Error(errorData.error || 'API request failed');
      error.response = {
        status: response.status,
        data: errorData
      };
      
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, operation, showToastOnError);
    throw error;
  }
}

export default { handleApiError, fetchWithErrorHandling };