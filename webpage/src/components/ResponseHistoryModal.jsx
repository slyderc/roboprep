import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button, IconButton } from './ui/Button';
import { usePrompts } from '../context/PromptContext';

/**
 * Modal for viewing and managing saved responses for a prompt
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {string} props.promptId - The ID of the prompt whose responses to show
 * @returns {JSX.Element} The ResponseHistoryModal component
 */
export function ResponseHistoryModal({ isOpen, onClose, promptId, initialIndex = 0, onResponseDeleted }) {
  const { getResponsesForPrompt, deleteResponse, updateResponse } = usePrompts();
  const [responses, setResponses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const [noResponses, setNoResponses] = useState(false);
  const textareaRef = useRef(null);
  
  // Load responses when the modal opens
  useEffect(() => {
    if (isOpen && promptId) {
      const promptResponses = getResponsesForPrompt(promptId);
      setResponses(promptResponses);
      
      // Set the current index to the initialIndex, but make sure it's within bounds
      const safeIndex = promptResponses.length > 0
        ? Math.min(initialIndex, promptResponses.length - 1)
        : 0;
      setCurrentIndex(safeIndex);
      
      setNoResponses(promptResponses.length === 0);
      
      // Reset other states
      setIsEditing(false);
      setHasEdits(false);
      setCopySuccess(false);
      setConfirmDelete(false);
      
      // Initialize edited text if responses exist
      if (promptResponses.length > 0 && promptResponses[safeIndex]?.responseText) {
        setEditedText(promptResponses[safeIndex].responseText);
      } else {
        setEditedText('');
      }
    }
  }, [isOpen, promptId, initialIndex, getResponsesForPrompt]);
  
  // Update edited text when current response changes
  useEffect(() => {
    if (responses.length > 0 && currentIndex >= 0 && currentIndex < responses.length) {
      const response = responses[currentIndex];
      if (response?.responseText) {
        setEditedText(response.responseText);
        setHasEdits(false);
      }
    }
  }, [currentIndex, responses]);
  
  // Reset editing state
  const resetEditing = () => {
    setIsEditing(false);
    setHasEdits(false);
  };
  
  // Navigate through responses
  const handleNext = () => {
    if (isEditing && hasEdits) {
      if (window.confirm('You have unsaved edits. Discard them and continue?')) {
        resetEditing();
        navigateToNext();
      }
    } else {
      resetEditing();
      navigateToNext();
    }
  };
  
  const navigateToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % responses.length);
    setCopySuccess(false);
  };
  
  const handlePrevious = () => {
    if (isEditing && hasEdits) {
      if (window.confirm('You have unsaved edits. Discard them and continue?')) {
        resetEditing();
        navigateToPrevious();
      }
    } else {
      resetEditing();
      navigateToPrevious();
    }
  };
  
  const navigateToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + responses.length) % responses.length);
    setCopySuccess(false);
  };
  
  // Copy response to clipboard
  const handleCopy = () => {
    // Only attempt to copy if we have responses
    if (responses.length === 0) return;
    
    const currentResponse = responses[currentIndex];
    const textToCopy = hasEdits ? editedText : currentResponse?.responseText;
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    }
  };
  
  // Handle text editing
  const handleTextClick = () => {
    setIsEditing(true);
    // Focus the textarea after a short delay to allow rendering
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };
  
  const handleTextChange = (e) => {
    setEditedText(e.target.value);
    // Only compare if we have a current response
    if (responses.length > 0) {
      const currentResponse = responses[currentIndex];
      setHasEdits(e.target.value !== currentResponse?.responseText);
    }
  };
  
  const handleSaveEdit = async () => {
    if (responses.length === 0) return;
    
    const currentResponse = responses[currentIndex];
    if (!currentResponse || !hasEdits) return;
    
    try {
      // Create a modified response object with the edited text
      const updatedResponse = {
        ...currentResponse,
        responseText: editedText
      };
      
      // Update the response in storage
      await updateResponse(updatedResponse);
      
      // Update the local responses state
      const updatedResponses = responses.map(r => 
        r.id === currentResponse.id ? updatedResponse : r
      );
      setResponses(updatedResponses);
      
      // Update the edited text to show the new value
      setEditedText(updatedResponse.responseText);
      
      // Reset editing state but keep showing the updated text
      setHasEdits(false);
      setIsEditing(false);
      
      // Notify parent component that a response was updated
      // Use the same callback as deletion to refresh the list
      if (onResponseDeleted && typeof onResponseDeleted === 'function') {
        onResponseDeleted(currentResponse.id, 'edit');
      }
    } catch (err) {
      console.error('Error updating response:', err);
      alert('Failed to save your edits. Please try again.');
    }
  };
  
  const handleCancelEdit = () => {
    if (responses.length === 0) {
      setEditedText('');
    } else {
      const currentResponse = responses[currentIndex];
      setEditedText(currentResponse?.responseText || '');
    }
    setHasEdits(false);
    setIsEditing(false);
  };
  
  // Handle delete confirmation
  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };
  
  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };
  
  // Handle delete response
  const handleDelete = async () => {
    if (responses.length === 0) return;
    
    const currentResponse = responses[currentIndex];
    if (!currentResponse) return;
    
    try {
      await deleteResponse(currentResponse.id);
      
      // Update the responses list
      const updatedResponses = responses.filter(r => r.id !== currentResponse.id);
      
      // Save deleted response ID to notify parent
      const deletedResponseId = currentResponse.id;
      
      if (updatedResponses.length === 0) {
        // If no responses left, set noResponses flag
        setNoResponses(true);
        // Reset states
        setResponses([]);
        setCurrentIndex(0);
        setEditedText('');
        
        // Auto-close the modal if there are no more responses
        if (onClose) {
          setTimeout(() => onClose(), 300);
        }
      } else {
        // Update the responses and adjust the index if needed
        setResponses(updatedResponses);
        if (currentIndex >= updatedResponses.length) {
          setCurrentIndex(updatedResponses.length - 1);
        }
      }
      
      setConfirmDelete(false);
      
      // Notify parent component that a response was deleted
      if (onResponseDeleted && typeof onResponseDeleted === 'function') {
        onResponseDeleted(deletedResponseId);
      }
    } catch (err) {
      console.error('Error deleting response:', err);
      setConfirmDelete(false);
    }
  };
  
  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render empty state if no responses
  if (noResponses) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Saved Responses">
        <div className="p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">No saved responses found for this prompt.</p>
        </div>
      </Modal>
    );
  }
  
  // Main render with responses
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved Responses" maxWidth="2xl">
      <div className="p-2">
        {responses.length > 0 && (
          <>
            {/* Navigation indicator */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Response {currentIndex + 1} of {responses.length}
              </div>
              
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={handlePrevious}
                  disabled={responses.length <= 1}
                  title="Previous response"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  }
                />
                <IconButton
                  onClick={handleNext}
                  disabled={responses.length <= 1}
                  title="Next response"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  }
                />
              </div>
            </div>
            
            {/* Variables used */}
            {responses[currentIndex]?.variablesUsed && 
              Object.keys(responses[currentIndex].variablesUsed).length > 0 && (
                <div className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(responses[currentIndex].variablesUsed).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1 max-w-full">
                        <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium truncate max-w-[120px]" title={key}>
                          {key}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300 text-sm truncate max-w-[180px]" title={value}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            
            {/* Edit instruction */}
            <div className="text-left mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Click to edit response text</span>
            </div>
            
            {/* Response content */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4 max-h-80 overflow-y-auto">
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  className="w-full h-full min-h-[200px] text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                  value={editedText}
                  onChange={handleTextChange}
                />
              ) : (
                <div 
                  className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded"
                  onClick={handleTextClick}
                  title="Click to edit"
                >
                  {hasEdits ? editedText : responses[currentIndex]?.responseText}
                </div>
              )}
            </div>
            
            {/* Response metadata */}
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div>Created: {formatDate(responses[currentIndex]?.createdAt)}</div>
              {responses[currentIndex]?.modelUsed && <div>Model: {responses[currentIndex]?.modelUsed}</div>}
              {responses[currentIndex]?.totalTokens && (
                <div>
                  Tokens: {responses[currentIndex]?.totalTokens} 
                  ({responses[currentIndex]?.promptTokens} prompt, 
                  {responses[currentIndex]?.completionTokens} completion)
                </div>
              )}
            </div>
            
            {/* Actions */}
            {confirmDelete ? (
              <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
                <div className="text-center mb-4">
                  <p className="text-gray-800 dark:text-gray-200 font-medium">Delete this response?</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">This action cannot be undone.</p>
                </div>
                <div className="flex justify-center gap-3">
                  <Button onClick={handleCancelDelete} variant="secondary">Cancel</Button>
                  <Button onClick={handleDelete} variant="danger">Delete</Button>
                </div>
              </div>
            ) : isEditing ? (
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={handleCancelEdit} 
                  variant="danger"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={handleSaveEdit} 
                  variant="success"
                  disabled={!hasEdits}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  }
                >
                  Save Edits
                </Button>
              </div>
            ) : (
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={handleDeleteClick} 
                  variant="danger"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Delete
                </Button>
                
                <Button 
                  onClick={handleCopy} 
                  variant="primary"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  }
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}