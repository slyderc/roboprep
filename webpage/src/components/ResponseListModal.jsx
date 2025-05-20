import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { formatDistanceToNow } from 'date-fns';

/**
 * Modal for displaying a list of all saved responses for a prompt
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {Array} props.responses - Array of responses to display
 * @param {function} props.onSelectResponse - Function called when a response is selected
 * @param {Object} props.promptData - The prompt data
 * @returns {JSX.Element} The ResponseListModal component
 */
export function ResponseListModal({ isOpen, onClose, responses, onSelectResponse, promptData }) {
  // Format date as a relative time (e.g., "2 hours ago")
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Truncate text to a specific length with ellipsis
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // If there are no responses at all, don't show the modal
  if (isOpen && responses.length === 0) {
    setTimeout(() => onClose(), 0);
    return null;
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${responses.length} ${responses.length === 1 ? 'response' : 'responses'} saved`} maxWidth="2xl">
      {responses.length === 0 ? (
        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
          No saved responses found for this prompt.
        </div>
      ) : (
        <div className="space-y-3 p-2 max-h-[70vh] overflow-y-auto">
          {responses.map((response, index) => (
            <div 
              key={response.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:border-purple-300 dark:hover:border-purple-500 hover:shadow transition cursor-pointer dark:bg-gray-800"
              onClick={() => onSelectResponse(index)}
            >
              <div className="p-3">
                {/* Variables used */}
                {response.variablesUsed && Object.keys(response.variablesUsed).length > 0 && (
                  <div className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(response.variablesUsed).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1 max-w-full">
                          <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-xs font-medium truncate max-w-[120px]" title={key}>
                            {key}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300 text-sm truncate max-w-[180px]" title={value}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Preview of response text */}
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-2">
                  {truncateText(response.responseText, 150)}
                </div>
                
                {/* Metadata */}
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    Created {formatDate(response.createdAt)}
                  </div>
                  {response.lastEdited && (
                    <div>
                      Edited {formatDate(response.lastEdited)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}