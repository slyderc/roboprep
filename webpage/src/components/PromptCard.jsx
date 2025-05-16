import React, { useState, useEffect } from 'react';
import { usePrompts } from '../context/PromptContext';
import { IconButton } from './ui/Button';
import { detectVariables } from '../lib/formatPromptDisplay';

export function PromptCard({ prompt, onCopy, onEdit }) {
  const { favorites, toggleFavorite, deletePrompt } = usePrompts();
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  const isFavorite = favorites.includes(prompt.id);
  const hasVariables = detectVariables(prompt.promptText).length > 0;
  
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
  
  return (
    <div 
      className={`
        bg-white rounded-md border border-gray-200 p-3 hover:shadow-md shadow-sm mb-3 transition-shadow duration-200
        ${hasVariables ? 'clickable-prompt cursor-pointer' : ''}
      `}
      onClick={hasVariables ? () => onCopy(prompt, () => setShowCopyToast(true)) : undefined}
      title={hasVariables ? "Click to replace variables and copy" : prompt.title}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-prompt-title text-blue-600 mb-1">{prompt.title}</h3>
        {/* Removed star indicator from here */}
      </div>
      
      <p className="text-prompt-desc text-gray-600 mb-2">
        {prompt.description || 'No description available.'}
      </p>
      
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {prompt.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-prompt-tag"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between gap-1 mt-2 border-t pt-2 border-gray-100">
        {/* Toast notification */}
        {showCopyToast && (
          <div className="bg-green-500 text-white text-xs py-1 px-2 rounded-md animate-fadeIn">
            Copied to clipboard!
          </div>
        )}
        
        <div className="flex items-center space-x-1 ml-auto">
          <IconButton
            onClick={handleFavoriteClick}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className={isFavorite ? 'text-red-500 hover:text-red-600' : 'hover:text-yellow-500'}
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
            className="hover:text-blue-600"
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
          
          <IconButton
            onClick={handleEditClick}
            title="Edit Prompt"
            className="hover:text-green-600"
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
          
          {prompt.isUserCreated && (
            <IconButton
              onClick={handleDeleteClick}
              title="Delete Prompt"
              variant="danger"
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
      </div>
    </div>
  );
}