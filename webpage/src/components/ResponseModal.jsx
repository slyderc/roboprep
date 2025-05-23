import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button, IconButton } from './ui/Button';
import { usePrompts } from '../context/PromptContext';

/**
 * Modal for displaying OpenAI responses and saving them
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {Object} props.promptData - The prompt that generated this response
 * @param {Object} props.response - The response from OpenAI
 * @param {boolean} props.loading - Whether the response is loading
 * @param {Object} props.error - Any error from the API
 * @returns {JSX.Element} The ResponseModal component
 */
export function ResponseModal({ isOpen, onClose, promptData, response, loading, error, onNewResponse }) {
  const { saveResponse, submitPromptToAi } = usePrompts();
  const [saved, setSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseError, setResponseError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const textareaRef = useRef(null);
  
  // Handle save response
  const handleSave = async () => {
    try {
      // Use the edited text if there are edits, otherwise use the original response text
      const responseToSave = {
        ...response,
        promptId: promptData?.id,
        responseText: hasEdits ? editedText : response.responseText
      };
      
      await saveResponse(responseToSave);
      
      // Update the state to reflect saved content
      setEditedText(responseToSave.responseText);
      setSaved(true);
    } catch (err) {
      console.error('Error saving response:', err);
    }
  };
  
  // Handle close
  const handleClose = () => {
    // Reset state when modal closes
    setSaved(false);
    setCopySuccess(false);
    setIsEditing(false);
    setHasEdits(false);
    onClose();
  };
  
  // Handle new response request
  const handleNewResponse = async () => {
    if (promptData) {
      // Reset states
      setSaved(false);
      setCopySuccess(false);
      setIsEditing(false);
      setHasEdits(false);
      
      // Show loading state
      if (typeof onNewResponse === 'function') {
        // Use the provided callback for generating a new response with variables from current response
        onNewResponse(promptData, response?.variablesUsed || {});
      } else {
        // Generate a new response directly
        try {
          // Set loading state
          setAiResponse(null);
          setIsLoading(true);
          
          // Generate new response with same prompt and variables
          const result = await submitPromptToAi(promptData, response?.variablesUsed || {});
          
          // Update the response
          setAiResponse(result);
          setEditedText(result.responseText);
        } catch (error) {
          console.error('Error generating new response:', error);
          setResponseError(error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };
  
  // Initialize edited text and internal response state when response changes
  useEffect(() => {
    if (response) {
      setAiResponse(response);
      setEditedText(response.responseText || '');
      // Reset loading and error states
      setIsLoading(false);
      setResponseError(null);
    }
  }, [response]);
  
  // Sync with external loading state
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);
  
  // Sync with external error state
  useEffect(() => {
    setResponseError(error);
  }, [error]);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    // Use edited text if available (regardless of hasEdits flag), 
    // otherwise fall back to original response
    const textToCopy = editedText || response?.responseText;
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      
      // Reset copy success after 2 seconds
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
    setHasEdits(e.target.value !== response?.responseText);
  };
  
  const handleSaveEdit = async () => {
    // Create a modified response object with the edited text
    const updatedResponse = {
      ...response,
      responseText: editedText
    };
    
    try {
      // Save the edited response and wait for it to complete
      await saveResponse(updatedResponse);
      
      // Keep the updated text visible after saving
      // This ensures the view shows the newly saved content
      setEditedText(updatedResponse.responseText);
      
      // Update UI state
      setSaved(true);
      setHasEdits(false);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving edited response:', err);
      alert('Failed to save your edits. Please try again.');
    }
  };
  
  const handleCancelEdit = () => {
    setEditedText(response?.responseText || '');
    setHasEdits(false);
    setIsEditing(false);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Response" maxWidth="2xl">
      <div className="p-2">
        {(loading || isLoading) && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {(error || responseError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {(error || responseError)?.message || 'Failed to get AI response'}
          </div>
        )}
        
        {!(loading || isLoading) && !(error || responseError) && (aiResponse || response) && (
          <div>
            {/* Prompt title if available */}
            {promptData && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Prompt</h3>
                <p className="text-gray-700">{promptData.title}</p>
              </div>
            )}
            
            {/* Response content */}
            <div className="bg-gray-50 p-4 rounded-md mb-4 max-h-96 overflow-y-auto">
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  className="w-full h-full min-h-[200px] text-gray-800 bg-white border border-gray-300 rounded p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                  value={editedText}
                  onChange={handleTextChange}
                />
              ) : (
                <div 
                  className="text-gray-800 whitespace-pre-wrap cursor-pointer hover:bg-gray-100 p-2 rounded"
                  onClick={handleTextClick}
                  title="Click to edit"
                >
                  {/* Show edited text if available, otherwise show original response */}
                  {editedText || response.responseText}
                </div>
              )}
            </div>
            
            {/* Response metadata */}
            {(aiResponse || response)?.modelUsed && (
              <div className="mb-4 text-xs text-gray-500">
                <p>Model: {(aiResponse || response).modelUsed}</p>
                {(aiResponse || response).totalTokens && (
                  <p>Tokens used: {(aiResponse || response).totalTokens} ({(aiResponse || response).promptTokens} prompt, {(aiResponse || response).completionTokens} completion)</p>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-between mt-6">
              <div>
                {isEditing ? (
                  <Button 
                    onClick={handleCancelEdit} 
                    variant="secondary"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button 
                    onClick={handleClose} 
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Close
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <Button 
                    onClick={handleSaveEdit} 
                    variant="primary"
                    disabled={!hasEdits}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  >
                    Save Edits
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleCopy} 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      }
                    >
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </Button>
                    
                    <Button 
                      onClick={handleNewResponse}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      }
                    >
                      New Response
                    </Button>
                    
                    <Button 
                      onClick={handleSave} 
                      className={saved ? "bg-gray-400 cursor-not-allowed text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                      disabled={saved}
                      icon={
                        saved ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                        )
                      }
                    >
                      {saved ? 'Saved' : 'Save Response'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}