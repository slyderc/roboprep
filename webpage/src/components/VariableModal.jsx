import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Label, Select, FormGroup } from './ui/Input';
import { detectVariables, replaceVariables, getPlaceholderExample } from '../lib/formatPromptDisplay';
import { usePrompts } from '../context/PromptContext';

export function VariableModal({ isOpen, onClose, prompt, onCopyComplete, onSubmitToAi }) {
  const [replacements, setReplacements] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const { addToRecentlyUsed } = usePrompts();
  const formRef = useRef(null);
  
  // Store variables outside of render cycle to prevent re-detection on each render
  const variablesRef = useRef([]);
  
  // Update variables only when prompt changes
  useEffect(() => {
    if (prompt?.promptText) {
      variablesRef.current = detectVariables(prompt.promptText);
    } else {
      variablesRef.current = [];
    }
  }, [prompt]);
  
  // Reset form when prompt changes
  useEffect(() => {
    if (isOpen && prompt) {
      setReplacements({});
      setShowPreview(false);
    }
  }, [isOpen, prompt]);
  
  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && formRef.current && variablesRef.current.length > 0) {
      const firstInput = formRef.current.querySelector('input, select');
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
        }, 100);
      }
    }
  }, [isOpen]);
  
  if (!prompt) return null;
  
  // Normalize newlines in promptText
  const normalizedPromptText = prompt.promptText.replace(/\\n/g, '\n');
  const variables = variablesRef.current;
  
  const handleInputChange = (variable, value) => {
    setReplacements(prev => ({
      ...prev,
      [variable]: value
    }));
  };
  
  const handlePreview = () => {
    setShowPreview(true);
  };
  
  const handleCopy = () => {
    // Use the normalized text for replacement
    const replacedText = replaceVariables(normalizedPromptText, replacements);
    
    // Copy to clipboard
    navigator.clipboard.writeText(replacedText)
      .then(() => {
        addToRecentlyUsed(prompt.id);
        if (onCopyComplete) {
          onCopyComplete();
        }
      })
      .catch(err => {
        console.error('Clipboard API copy failed: ', err);
        fallbackCopyToClipboard(replacedText);
      });
  };
  
  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        addToRecentlyUsed(prompt.id);
        if (onCopyComplete) {
          onCopyComplete();
        }
      }
    } catch (err) {
      console.error('Error during fallback copy: ', err);
    } finally {
      document.body.removeChild(textArea);
    }
  };
  
  // New handler for AI submission
  const handleSubmitToAi = () => {
    // Mark as recently used
    addToRecentlyUsed(prompt.id);
    
    // Call the parent handler with the prompt and variables
    if (onSubmitToAi) {
      onSubmitToAi(prompt, replacements);
      onClose();
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Prompt"
      footer={
        <>
          <Button 
            variant="secondary" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={handlePreview}
          >
            Preview
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="primary"
              onClick={handleCopy}
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
            >
              Copy
            </Button>
            <Button 
              onClick={handleSubmitToAi}
              className="bg-purple-600 hover:bg-purple-700 text-white"
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
            >
              Submit to AI
            </Button>
          </div>
        </>
      }
    >
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Enter replacement text for the variables in "<span className="font-semibold">{prompt.title}</span>".
      </p>
      
      <form ref={formRef} className="space-y-4 pr-2">
        {variables.map(variable => {
          const lowerVar = variable.toLowerCase();
          const isTimeVar = ['time', 'length', 'duration', 'trt'].some(kw => lowerVar.includes(kw));
          const label = variable.replace(/[_-]/g, ' ');
          
          if (isTimeVar) {
            return (
              <FormGroup key={variable}>
                <Label htmlFor={`var-${variable}`} className="capitalize">
                  {label}:
                </Label>
                <Select
                  id={`var-${variable}`}
                  name={`var-${variable}`}
                  value={replacements[variable] || ''}
                  onChange={(e) => handleInputChange(variable, e.target.value)}
                >
                  <option value="">Select duration...</option>
                  <option value="10 seconds">10s</option>
                  <option value="15 seconds">15s</option>
                  <option value="30 seconds">30s</option>
                  <option value="60 seconds">60s</option>
                  <option value="90 seconds">90s</option>
                </Select>
              </FormGroup>
            );
          } else {
            return (
              <FormGroup key={variable}>
                <Label htmlFor={`var-${variable}`} className="capitalize">
                  {label}:
                </Label>
                <Input
                  type="text"
                  id={`var-${variable}`}
                  name={`var-${variable}`}
                  placeholder={`e.g., ${getPlaceholderExample(variable)}`}
                  value={replacements[variable] || ''}
                  onChange={(e) => handleInputChange(variable, e.target.value)}
                />
              </FormGroup>
            );
          }
        })}
      </form>
      
      {showPreview && (
        <div className="mt-5 p-3 border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 max-h-48 overflow-y-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Preview:</p>
          <pre className="text-sm whitespace-pre-wrap dark:text-gray-200">
            {replaceVariables(normalizedPromptText, replacements)}
          </pre>
        </div>
      )}
    </Modal>
  );
}