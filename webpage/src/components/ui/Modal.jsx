import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) {
  const modalRef = useRef(null);
  
  // Handle escape key to close modal
  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if modal click-outside is temporarily disabled (for dropdowns)
      if (window.modalClickOutsideDisabled) {
        return;
      }
      
      // Don't close if clicking inside the modal
      if (modalRef.current && modalRef.current.contains(event.target)) {
        return;
      }
      
      // Don't close if clicking on dropdown options (rendered via portal)
      if (event.target.closest('[data-dropdown-option]')) {
        return;
      }
      
      // Close modal for other outside clicks
      if (isOpen) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  // Modal sizes
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 overflow-auto bg-black bg-opacity-70 flex items-center justify-center p-4 z-[50000] modal-overlay">
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${maxWidths[maxWidth]} animate-modal-in relative z-[50001] modal-container dark:text-gray-200`}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full"
            aria-label="Close"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <div className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  );
}