import React, { useState, useEffect } from 'react';
import { usePrompts } from '../context/PromptContext';
import { IconButton } from './ui/Button';
import { detectVariables } from '../lib/formatPromptDisplay';

export function PromptCard({ prompt, onCopy, onEdit, onSubmitToAi, onViewResponses }) {
  const { favorites, toggleFavorite, deletePrompt, countResponsesForPrompt } = usePrompts();
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  
  const isFavorite = favorites.includes(prompt.id);
  const hasVariables = detectVariables(prompt.promptText).length > 0;
  
  // Get response count when component mounts
  useEffect(() => {
    if (prompt?.id) {
      setResponseCount(countResponsesForPrompt(prompt.id));
    }
  }, [prompt?.id, countResponsesForPrompt]);
  
  // Handle toast timeout
  useEffect(() => {
    let toastTimer;
    if (showCopyToast) {
      toastTimer = setTimeout(() => {
        setShowCopyToast(false);
      }, 3000);
    }
    return () => clearTimeout(toastTimer);
  }, [showCopyToast]);
  
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(prompt.id);
  };
  
  const handleCopyClick = (e) => {
    e.stopPropagation();
    onCopy(prompt, () => setShowCopyToast(true));
  };
  
  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(prompt);
  };
  
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${prompt.title}"? This cannot be undone.`)) {
      deletePrompt(prompt.id);
    }
  };
  
  // New handler for AI submission
  const handleSubmitToAiClick = (e) => {
    e.stopPropagation();
    onSubmitToAi(prompt);
  };
  
  // New handler for viewing responses
  const handleViewResponsesClick = (e) => {
    e.stopPropagation();
    onViewResponses(prompt);
  };
  
  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md shadow-sm mb-3 transition-shadow duration-200 relative
        ${hasVariables ? 'clickable-prompt cursor-pointer' : 'opacity-95'}
      `}
      onClick={hasVariables ? () => onCopy(prompt, () => setShowCopyToast(true)) : undefined}
      title={hasVariables ? "Click to replace variables and copy" : "This prompt has no variables - use the action buttons below"}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-blue-600 dark:text-blue-400 font-semibold mb-2 inline-block py-1 px-3 bg-blue-100 dark:bg-blue-900/40 rounded-md text-base leading-tight shadow-sm">
          {prompt.title}
        </h3>
        
        {/* Response count badge */}
        {responseCount > 0 && (
          <span 
            onClick={(e) => {
              e.stopPropagation();
              onViewResponses(prompt);
            }}
            className="inline-flex items-center justify-center h-5 min-w-5 px-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium cursor-pointer hover:bg-purple-200"
            title={`View ${responseCount} saved response${responseCount === 1 ? '' : 's'}`}
          >
            {responseCount}
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 ml-1">
        {prompt.description || 'No description available.'}
      </p>
      
      {!hasVariables && (
        <div className="flex items-center gap-1 mb-2 ml-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">No variables - Use action buttons to copy or submit</span>
        </div>
      )}
      
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {prompt.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-xs inline-flex items-center justify-center min-h-5 leading-tight transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-1 mt-2 border-t pt-2 border-gray-100 dark:border-gray-700">
        {/* Toast notification */}
        {showCopyToast && (
          <div className="bg-green-500 dark:bg-green-600 text-white text-xs py-1 px-2 rounded-md animate-fadeIn absolute top-2 left-1/2 transform -translate-x-1/2">
            Copied to clipboard!
          </div>
        )}
        
        {/* Delete button on the far left */}
        <div className="flex-none">
          {prompt.isUserCreated && (
            <IconButton
              onClick={handleDeleteClick}
              title="Delete Prompt"
              variant="danger"
              className="px-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              icon={
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
            />
          )}
        </div>
        
        {/* Visual separator when delete button is shown */}
        {prompt.isUserCreated && <div className="border-r border-gray-200 dark:border-gray-700 h-6 mx-2"></div>}
        
        <div className="flex items-center space-x-1 ml-auto flex-grow justify-end">
          
          <IconButton
            onClick={handleFavoriteClick}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className={isFavorite ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300' : 'hover:text-yellow-500 dark:hover:text-yellow-400'}
            icon={
              <svg 
                className="w-4 h-4" 
                fill={isFavorite ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            }
          />
          
          <IconButton
            onClick={handleCopyClick}
            title="Copy Prompt"
            className="hover:text-blue-600 dark:hover:text-blue-400"
            icon={
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            }
          />
          
          {/* New Submit to AI button */}
          <IconButton
            onClick={handleSubmitToAiClick}
            title="Submit to AI"
            className="hover:text-purple-600 dark:hover:text-purple-400"
            icon={
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" 
                />
              </svg>
            }
          />
          
          <IconButton
            onClick={handleEditClick}
            title="Edit Prompt"
            className="hover:text-green-600 dark:hover:text-green-400"
            icon={
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"
                />
              </svg>
            }
          />
          
          {/* View Response History button */}
          {responseCount > 0 && (
            <IconButton
              onClick={handleViewResponsesClick}
              title={`View ${responseCount} Response${responseCount !== 1 ? 's' : ''}`}
              className="hover:text-purple-600 dark:hover:text-purple-400"
              icon={
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}