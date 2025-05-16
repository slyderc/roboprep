# OpenAI Integration for RoboPrep Web Application

This document outlines the implementation steps required to add OpenAI API integration to the RoboPrep web application. This feature will allow users to send prompts directly to OpenAI's ChatGPT-4o and save the responses.

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [UI Modifications](#ui-modifications)
3. [API Integration](#api-integration)
4. [Response Handling and Storage](#response-handling-and-storage)
5. [Result Viewing and Management](#result-viewing-and-management)
6. [Export Functionality](#export-functionality)

## Environment Setup

### 1. Dependencies Installation
```bash
npm install openai dotenv-webpack react-modal
```

### 2. Environment Configuration
Create a `.env.local` file in the root of the web application directory with the following variables:
```
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_MAX_TOKENS=2048
NEXT_PUBLIC_OPENAI_TEMPERATURE=0.7
```

### 3. Update Next.js Configuration
Modify `next.config.js` to enable environment variables:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    OPENAI_MODEL: process.env.NEXT_PUBLIC_OPENAI_MODEL,
    OPENAI_MAX_TOKENS: process.env.NEXT_PUBLIC_OPENAI_MAX_TOKENS,
    OPENAI_TEMPERATURE: process.env.NEXT_PUBLIC_OPENAI_TEMPERATURE,
  },
};

module.exports = nextConfig;
```

### 4. Add Environment Variables to `.gitignore`
Update `.gitignore` to prevent sensitive information from being committed:
```
# OpenAI API
.env.local
.env.*.local
```

## UI Modifications

### 1. Modify PromptCard Component
Update the `PromptCard.jsx` component to include a "Submit to AI" button alongside the existing "Copy" button:

```jsx
// Add this after the Copy button (around line 128)
<IconButton
  onClick={handleSubmitToAiClick}
  title="Submit to AI"
  className="hover:text-purple-600"
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
```

Create a new handler function for the submit button:

```jsx
const handleSubmitToAiClick = (e) => {
  e.stopPropagation();
  // Open variable modal if there are variables
  // Otherwise submit directly
  if (hasVariables) {
    onSubmitToAi(prompt);
  } else {
    submitPromptToAi(prompt.promptText);
  }
};
```

Add a response counter badge to the PromptCard:

```jsx
// Add after the tags section (around line 75)
{responseCount > 0 && (
  <span 
    onClick={handleViewResponsesClick}
    className="inline-flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium cursor-pointer hover:bg-purple-200"
    title={`View ${responseCount} saved response${responseCount === 1 ? '' : 's'}`}
  >
    {responseCount}
  </span>
)}
```

### 2. Create Response Modal Component
Create a new component `ResponseModal.jsx` in the components directory to display OpenAI responses:

```jsx
import React, { useState } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { usePrompts } from '../context/PromptContext';

export function ResponseModal({ isOpen, onClose, promptData, response, loading, error }) {
  const { saveResponse, deleteResponse } = usePrompts();
  
  const handleSave = () => {
    saveResponse(response);
    onClose();
  };
  
  const handleDelete = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Response">
      <div className="p-4">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error.message || 'Failed to get AI response'}
          </div>
        )}
        
        {!loading && !error && response && (
          <div>
            <div className="bg-gray-50 p-4 rounded-md mb-4 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {response.responseText}
            </div>
            
            <div className="flex justify-between mt-4">
              <Button onClick={handleDelete} variant="secondary">
                Delete
              </Button>
              <Button onClick={handleSave} variant="primary">
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
```

### 3. Create VariableModal Update
Modify the existing `VariableModal.jsx` to add a "Submit to AI" button next to the "Copy" button:

```jsx
// Add to the modal footer buttons
<Button onClick={() => submitToAi(processedText)} variant="primary">
  Submit to AI
</Button>
```

### 4. Create Response History Viewer
Create a new component `ResponseHistoryModal.jsx` to allow users to browse through saved responses:

```jsx
import React, { useState } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { usePrompts } from '../context/PromptContext';

export function ResponseHistoryModal({ isOpen, onClose, promptId }) {
  const { getResponsesForPrompt, deleteResponse } = usePrompts();
  const responses = getResponsesForPrompt(promptId);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle empty responses
  if (responses.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Saved Responses">
        <div className="p-4 text-center">
          No saved responses found for this prompt.
        </div>
      </Modal>
    );
  }

  const currentResponse = responses[currentIndex];
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % responses.length);
  };
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + responses.length) % responses.length);
  };
  
  const handleDelete = async () => {
    await deleteResponse(currentResponse.id);
    if (responses.length <= 1) {
      onClose();
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved Responses">
      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">
          Response {currentIndex + 1} of {responses.length}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4 max-h-80 overflow-y-auto whitespace-pre-wrap">
          {currentResponse.responseText}
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          Created: {new Date(currentResponse.createdAt).toLocaleString()}
        </div>
        
        <div className="flex justify-between mt-4">
          <Button onClick={handleDelete} variant="danger">
            Delete
          </Button>
          
          <div className="flex gap-2">
            <Button 
              onClick={handlePrevious} 
              disabled={responses.length <= 1}
              variant="secondary"
            >
              Previous
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={responses.length <= 1}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

## API Integration

### 1. Create OpenAI Service
Create a new file `src/lib/openaiService.js` to handle API interactions:

```javascript
import { detectVariables, replaceVariables } from './formatPromptDisplay';

// OpenAI API client
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

// Helper function to identify retry-able errors
export function isRetryableError(error) {
  return (
    error.message.includes('rate limit') ||
    error.message.includes('timeout') ||
    error.message.includes('503') ||
    error.message.includes('429')
  );
}

// Function with retry logic
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
```

### 2. Create API Routes in Next.js
Create a new API route file `src/app/api/openai/route.js` to handle server-side API calls:

```javascript
import { NextResponse } from 'next/server';
import { submitToOpenAI } from '../../../lib/openaiService';

export async function POST(request) {
  try {
    const { promptText, variables } = await request.json();
    
    if (!promptText) {
      return NextResponse.json(
        { error: 'Prompt text is required' },
        { status: 400 }
      );
    }
    
    const response = await submitToOpenAI(promptText, variables || {});
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
```

### 3. Create Client-Side API Wrapper
Create a new helper function in `src/lib/apiClient.js` to handle API requests from the front end:

```javascript
// API client functions for front-end use

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
```

## Response Handling and Storage

### 1. Extend Data Storage Schema
Update the storage schema to include OpenAI responses:

```javascript
// Response object structure
{
  "id": "response_1234567890",           // Unique identifier
  "promptId": "associated_prompt_id",    // ID of the prompt that generated this response
  "responseText": "The API response text", // The content returned by OpenAI
  "modelUsed": "gpt-4o",                 // Model that generated the response
  "promptTokens": 150,                   // Number of tokens in the prompt
  "completionTokens": 250,               // Number of tokens in the response
  "totalTokens": 400,                    // Total tokens used
  "createdAt": "2023-05-15T14:30:00Z",   // ISO date string
  "variablesUsed": {                     // Record of variables used in this prompt
    "variable_name": "value"
  }
}
```

### 2. Update Storage Functions
Add functions to `src/lib/storage.js` to handle response data:

```javascript
// Add this to the existing storage.js file

// Initialize storage with responses
const storage = {
  // ... existing code ...
  
  // Helper functions for responses
  getResponses: async () => {
    const result = await storage.get({ 'aiResponses': [] });
    return result.aiResponses;
  },
  
  getResponsesForPrompt: async (promptId) => {
    const responses = await storage.getResponses();
    return responses.filter(r => r.promptId === promptId);
  },
  
  saveResponse: async (response) => {
    const responses = await storage.getResponses();
    
    // Generate a unique ID if not provided
    if (!response.id) {
      response.id = `response_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    
    // Ensure creation timestamp
    if (!response.createdAt) {
      response.createdAt = new Date().toISOString();
    }
    
    const updatedResponses = [...responses, response];
    await storage.set({ 'aiResponses': updatedResponses });
    return response;
  },
  
  deleteResponse: async (responseId) => {
    const responses = await storage.getResponses();
    const updatedResponses = responses.filter(r => r.id !== responseId);
    
    if (updatedResponses.length < responses.length) {
      await storage.set({ 'aiResponses': updatedResponses });
      return true;
    }
    return false;
  },
  
  countResponsesForPrompt: async (promptId) => {
    const responses = await storage.getResponses();
    return responses.filter(r => r.promptId === promptId).length;
  }
};
```

### 3. Update PromptContext Provider
Extend the `PromptContext.jsx` to include response-related state and functions:

```jsx
// Add to the imports
import { sendPromptToOpenAI } from '../lib/apiClient';

// Add to the PromptProvider state
const [responses, setResponses] = useState([]);

// Add to the useEffect that initializes storage
async function initializeStorage() {
  const data = await storage.get({
    'userPrompts': [],
    'corePrompts': defaultPrompts,
    'favorites': [],
    'recentlyUsed': [],
    'userCategories': [],
    'settings': { fontSize: 'medium' },
    'aiResponses': []  // Add this line
  });
  
  // ... existing code ...
  setResponses(data.aiResponses);
}

// Add these new functions to the PromptProvider
async function saveResponse(response) {
  // Make sure the response has a promptId
  if (!response.promptId) {
    throw new Error('Response must have a promptId');
  }
  
  const newResponse = {
    ...response,
    id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString()
  };
  
  const updatedResponses = [...responses, newResponse];
  setResponses(updatedResponses);
  await storage.set({ 'aiResponses': updatedResponses });
  return newResponse;
}

async function deleteResponse(responseId) {
  const updatedResponses = responses.filter(r => r.id !== responseId);
  
  if (updatedResponses.length < responses.length) {
    setResponses(updatedResponses);
    await storage.set({ 'aiResponses': updatedResponses });
    return true;
  }
  return false;
}

function getResponsesForPrompt(promptId) {
  return responses.filter(r => r.promptId === promptId);
}

function countResponsesForPrompt(promptId) {
  return getResponsesForPrompt(promptId).length;
}

async function submitPromptToAi(prompt, variables = {}) {
  try {
    // If prompt is an object, use its text and ID
    const promptText = typeof prompt === 'object' ? prompt.promptText : prompt;
    const promptId = typeof prompt === 'object' ? prompt.id : null;
    
    const result = await sendPromptToOpenAI(promptText, variables);
    
    // Add promptId to the response if available
    if (promptId) {
      result.promptId = promptId;
      result.variablesUsed = variables;
    }
    
    return result;
  } catch (error) {
    console.error('Error submitting prompt to AI:', error);
    throw error;
  }
}

// Add new functions to the context value
const value = {
  // ... existing properties ...
  
  // AI response related
  responses,
  saveResponse,
  deleteResponse,
  getResponsesForPrompt,
  countResponsesForPrompt,
  submitPromptToAi
};
```

## Result Viewing and Management

### 1. Update HomePage Component
Update the `HomePage.jsx` component to manage the OpenAI interaction workflow:

```jsx
// Add state for the response modals
const [responseModalOpen, setResponseModalOpen] = useState(false);
const [responseHistoryModalOpen, setResponseHistoryModalOpen] = useState(false);
const [currentPrompt, setCurrentPrompt] = useState(null);
const [aiResponse, setAiResponse] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [responseError, setResponseError] = useState(null);

// Add functions to handle submissions
const handleSubmitToAi = (prompt) => {
  // If prompt has variables, open variable modal
  if (detectVariables(prompt.promptText).length > 0) {
    setCurrentPrompt(prompt);
    setVariableModalOpen(true);
  } else {
    // Otherwise submit directly
    submitPromptToAiDirectly(prompt);
  }
};

const handleVariableSubmission = async (processedText, variables) => {
  setVariableModalOpen(false);
  
  if (!currentPrompt) return;
  
  try {
    setIsLoading(true);
    setResponseError(null);
    setResponseModalOpen(true);
    
    const result = await submitPromptToAi(currentPrompt, variables);
    setAiResponse(result);
  } catch (error) {
    setResponseError(error);
  } finally {
    setIsLoading(false);
  }
};

const submitPromptToAiDirectly = async (prompt) => {
  setCurrentPrompt(prompt);
  
  try {
    setIsLoading(true);
    setResponseError(null);
    setResponseModalOpen(true);
    
    const result = await submitPromptToAi(prompt);
    setAiResponse(result);
  } catch (error) {
    setResponseError(error);
  } finally {
    setIsLoading(false);
  }
};

const handleViewResponses = (prompt) => {
  setCurrentPrompt(prompt);
  setResponseHistoryModalOpen(true);
};

// Add the response modals to the component JSX
<ResponseModal
  isOpen={responseModalOpen}
  onClose={() => setResponseModalOpen(false)}
  promptData={currentPrompt}
  response={aiResponse}
  loading={isLoading}
  error={responseError}
/>

<ResponseHistoryModal
  isOpen={responseHistoryModalOpen}
  onClose={() => setResponseHistoryModalOpen(false)}
  promptId={currentPrompt?.id}
/>
```

### 2. Update PromptCard Component
Add the counter badge and response handling to the PromptCard:

```jsx
// Add to the component props
export function PromptCard({ prompt, onCopy, onEdit, onSubmitToAi, onViewResponses }) {
  // Add to the existing state
  const { countResponsesForPrompt } = usePrompts();
  const [responseCount, setResponseCount] = useState(0);
  
  // Add useEffect to get response count
  useEffect(() => {
    if (prompt?.id) {
      setResponseCount(countResponsesForPrompt(prompt.id));
    }
  }, [prompt?.id, countResponsesForPrompt]);
  
  // Add handler functions
  const handleSubmitToAiClick = (e) => {
    e.stopPropagation();
    onSubmitToAi(prompt);
  };
  
  const handleViewResponsesClick = (e) => {
    e.stopPropagation();
    onViewResponses(prompt);
  };
  
  // Add to the icons row in JSX
  <IconButton
    onClick={handleSubmitToAiClick}
    title="Submit to AI"
    className="hover:text-purple-600"
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
```

### 3. Update VariableModal Component
Modify the `VariableModal` component to handle AI submissions:

```jsx
// Add to props
export function VariableModal({ isOpen, onClose, prompt, onCopy, onSubmitToAi }) {
  // Add submit handler
  const handleSubmitToAi = () => {
    if (processedText) {
      onSubmitToAi(processedText, variableValues);
    }
  };
  
  // Add button to the modal footer
  <div className="flex justify-between mt-6">
    <Button variant="secondary" onClick={onClose}>
      Cancel
    </Button>
    <div className="flex gap-2">
      <Button variant="primary" onClick={handleCopy}>
        Copy
      </Button>
      <Button 
        variant="primary" 
        onClick={handleSubmitToAi}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        Submit to AI
      </Button>
    </div>
  </div>
```

## Export Functionality

### 1. Update Export Format
Modify the export functionality in `src/lib/importExportUtil.js` to include saved responses:

```javascript
// Update the exportData function
export async function exportData() {
  const data = await storage.get({
    'userPrompts': [],
    'userCategories': [],
    'aiResponses': []
  });
  
  return {
    version: '2.0',
    date: new Date().toISOString(),
    prompts: data.userPrompts,
    categories: data.userCategories,
    responses: data.aiResponses
  };
}
```

### 2. Extend Import Function
Update the import function to handle the responses data:

```javascript
// Update the importData function
export async function importData(jsonData, options = {}) {
  // Validate the data
  if (!jsonData.prompts || !Array.isArray(jsonData.prompts)) {
    throw new Error('Invalid import data: prompts array is missing or invalid');
  }
  
  // Current data
  const currentData = await storage.get({
    'userPrompts': [],
    'userCategories': [],
    'aiResponses': []
  });
  
  const importStats = {
    prompts: { total: 0, imported: 0, skipped: 0 },
    categories: { total: 0, imported: 0, skipped: 0 },
    responses: { total: 0, imported: 0, skipped: 0 }
  };
  
  // Process prompts
  // ... existing prompt import code ...
  
  // Process categories
  // ... existing category import code ...
  
  // Process responses if available and import is enabled
  if (jsonData.responses && Array.isArray(jsonData.responses) && !options.skipResponses) {
    importStats.responses.total = jsonData.responses.length;
    
    // Get a map of existing response IDs for duplicate checking
    const existingResponseIds = new Set(currentData.aiResponses.map(r => r.id));
    
    // Process each response
    const responsesToImport = [];
    
    for (const response of jsonData.responses) {
      // Skip responses without required fields
      if (!response.id || !response.promptId || !response.responseText) {
        importStats.responses.skipped++;
        continue;
      }
      
      // Skip duplicates if option is set
      if (options.skipDuplicates && existingResponseIds.has(response.id)) {
        importStats.responses.skipped++;
        continue;
      }
      
      // Add to import list
      responsesToImport.push(response);
      importStats.responses.imported++;
    }
    
    // Update storage with imported responses
    if (responsesToImport.length > 0) {
      const newResponses = [...currentData.aiResponses, ...responsesToImport];
      await storage.set({ 'aiResponses': newResponses });
    }
  }
  
  return importStats;
}
```

### 3. Update SettingsModal Component
Update the `SettingsModal.jsx` component to include options for responses in import/export:

```jsx
// Add additional state for response options
const [includeResponses, setIncludeResponses] = useState(true);

// Update the export function
const handleExport = async () => {
  try {
    setIsExporting(true);
    
    const exportData = await exportData();
    
    // Remove responses if not included
    if (!includeResponses) {
      delete exportData.responses;
    }
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `roboprep-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportMessage({
      type: 'success',
      text: `${exportData.prompts.length} prompts${includeResponses ? ` and ${exportData.responses?.length || 0} responses` : ''} exported successfully!`
    });
  } catch (error) {
    console.error('Export error:', error);
    setExportMessage({
      type: 'error',
      text: `Export failed: ${error.message}`
    });
  } finally {
    setIsExporting(false);
  }
};

// Update the import function to handle responses
const handleImport = async (event) => {
  // ... existing code ...
  
  try {
    const importStats = await importData(jsonData, {
      skipDuplicates: skipDuplicates,
      skipResponses: !includeResponses
    });
    
    setImportMessage({
      type: 'success',
      text: `Imported ${importStats.prompts.imported} prompts, ${importStats.categories.imported} categories${includeResponses ? `, and ${importStats.responses.imported} responses` : ''}!`
    });
    
    // ... existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
};

// Add checkbox to the export section
<div className="flex items-center mb-4">
  <input
    type="checkbox"
    id="includeResponses"
    checked={includeResponses}
    onChange={(e) => setIncludeResponses(e.target.checked)}
    className="h-4 w-4 text-blue-600 rounded"
  />
  <label htmlFor="includeResponses" className="ml-2 text-sm">
    Include AI responses
  </label>
</div>
```

---

## Implementation Timeline

1. **Environment Setup**: 1 day
2. **API Integration**: 2-3 days
3. **Storage Implementation**: 1-2 days
4. **UI Components**: 3-4 days
5. **Testing and Refinement**: 2-3 days

Total estimated implementation time: 9-13 days

## Security Considerations

1. Never expose the API key in client-side code
2. Implement rate limiting to prevent excessive API usage
3. Consider adding user authentication for the API feature
4. Sanitize all user inputs before sending to the API
5. Store responses securely, especially if they might contain sensitive information

## Future Enhancements

1. Support for multiple LLM providers (Claude, Gemini, etc.)
2. Advanced prompt settings (system messages, temperature adjustment)
3. Response formatting options
4. Streaming responses for better UX
5. Response analytics (token usage, response times)