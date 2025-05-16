# RoboPrep Web Application Conversion Plan

## Architecture Overview

We'll convert the Robo Show Prep Chrome extension into a responsive web application using the following technology stack:

### Technology Stack
- **Frontend Framework**: React with Next.js
- **Styling**: Tailwind CSS (maintaining consistency with extension)
- **State Management**: React Context API + localStorage
- **Data Persistence**: localStorage (client-side) with optional user accounts
- **Deployment**: Vercel (or similar hosting platform)

### Key Components

1. **Core Application**
   - Single-page application with responsive design
   - Preserves extension functionality but adapts for web
   - Follows modern web application patterns

2. **Data Layer**
   - Maintains the same data structures as the extension
   - Uses localStorage for anonymous users
   - Optional user accounts for cloud sync/backup

3. **UI Components**
   - Responsive design with mobile-first approach
   - Preserves extension's UX while adapting for web contexts
   - Uses modern React patterns (hooks, context)

## Project Structure

```
/
├── public/
│   ├── assets/
│   │   ├── icons/
│   │   └── logo/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── page.js               # Main dashboard page
│   │   ├── layout.js             # Main layout component
│   │   ├── settings/
│   │   │   └── page.js           # Settings page
│   │   └── prompts/
│   │       └── page.js           # Alternative prompt management view
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   └── ...
│   │   ├── CategoryList.jsx      # Category navigation
│   │   ├── PromptCard.jsx        # Individual prompt card
│   │   ├── NewPromptModal.jsx    # Create/edit prompt modal
│   │   ├── VariableModal.jsx     # Variable replacement modal
│   │   ├── PromptDisplay.jsx     # Display formatted prompts
│   │   ├── ImportPrompts.jsx     # Import functionality
│   │   └── ...
│   ├── context/
│   │   ├── PromptContext.jsx     # Core data management
│   │   └── SettingsContext.jsx   # User preferences
│   ├── lib/
│   │   ├── storage.js            # LocalStorage wrapper
│   │   ├── formatPromptDisplay.js
│   │   ├── parsePromptUtil.js
│   │   └── ...
│   ├── data/
│   │   └── prompts.json          # Default prompts
│   └── styles/
│       └── globals.css           # Global styles (including Tailwind)
├── package.json
├── tailwind.config.js
└── next.config.js
```

## Core Functionality Implementation

### 1. Storage System

We'll implement a storage wrapper that mimics the Chrome extension's storage API:

```javascript
// src/lib/storage.js
const storage = {
  get: async (keys) => {
    const result = {};
    if (typeof keys === 'string') {
      result[keys] = JSON.parse(localStorage.getItem(keys));
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        result[key] = JSON.parse(localStorage.getItem(key));
      });
    } else {
      Object.keys(keys).forEach(key => {
        const value = localStorage.getItem(key);
        result[key] = value !== null ? JSON.parse(value) : keys[key];
      });
    }
    return result;
  },
  
  set: async (items) => {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  },
  
  remove: async (keys) => {
    if (typeof keys === 'string') {
      localStorage.removeItem(keys);
    } else {
      keys.forEach(key => localStorage.removeItem(key));
    }
  },
  
  clear: async () => {
    localStorage.clear();
  }
};

export default storage;
```

### 2. PromptContext

The PromptContext will handle all prompt-related data management:

```javascript
// src/context/PromptContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import storage from '../lib/storage';
import defaultPrompts from '../data/prompts.json';

const PromptContext = createContext();

export function PromptProvider({ children }) {
  const [userPrompts, setUserPrompts] = useState([]);
  const [corePrompts, setCorePrompts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize storage
  useEffect(() => {
    async function initializeStorage() {
      const data = await storage.get({
        'userPrompts': [],
        'corePrompts': defaultPrompts,
        'favorites': [],
        'recentlyUsed': [],
        'userCategories': []
      });
      
      setUserPrompts(data.userPrompts);
      setCorePrompts(data.corePrompts);
      setFavorites(data.favorites);
      setRecentlyUsed(data.recentlyUsed);
      setUserCategories(data.userCategories);
      setInitialized(true);
    }
    
    initializeStorage();
  }, []);
  
  // Core functions for prompt management
  async function addPrompt(prompt) {
    const newPrompt = {
      ...prompt,
      id: `user_${Date.now()}`,
      isUserCreated: true,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    
    const updatedPrompts = [...userPrompts, newPrompt];
    setUserPrompts(updatedPrompts);
    await storage.set({ 'userPrompts': updatedPrompts });
    return newPrompt;
  }
  
  // Additional functions for managing prompts, favorites, etc.
  
  const value = {
    userPrompts,
    corePrompts,
    favorites,
    recentlyUsed,
    userCategories,
    addPrompt,
    // Other functions
    initialized
  };
  
  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
}

export function usePrompts() {
  return useContext(PromptContext);
}
```

## UI Component Implementation

We'll convert the existing components to React components. Example of the PromptCard:

```jsx
// src/components/PromptCard.jsx
import { useState } from 'react';
import { usePrompts } from '../context/PromptContext';

export default function PromptCard({ prompt, onSelect }) {
  const { favorites, toggleFavorite } = usePrompts();
  const [showOptions, setShowOptions] = useState(false);
  
  const isFavorite = favorites.includes(prompt.id);
  
  function handleFavoriteClick(e) {
    e.stopPropagation();
    toggleFavorite(prompt.id);
  }
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onSelect(prompt)}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">{prompt.title}</h3>
        <button 
          onClick={handleFavoriteClick}
          className="text-yellow-500"
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>
      
      <p className="text-gray-600 mt-2">{prompt.description}</p>
      
      <div className="flex flex-wrap gap-1 mt-3">
        {prompt.tags.map(tag => (
          <span 
            key={tag} 
            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
```

## Responsive Design Strategy

The web app will use a responsive design approach:

1. **Mobile View (< 640px)**
   - Single column layout
   - Bottom navigation for categories
   - Modal-based prompt editing

2. **Tablet View (640px - 1024px)**
   - Two-column layout (categories + prompts)
   - Sidebar navigation
   - Inline prompt editing options

3. **Desktop View (> 1024px)**
   - Three-column layout (categories, prompts, preview)
   - Full-featured interface
   - Expanded editing capabilities

## Next Steps

1. Set up the Next.js project with Tailwind CSS
2. Implement the storage and context providers
3. Convert UI components to React
4. Build responsive layouts
5. Implement the core prompt functionality
6. Add import/export capabilities
7. Test thoroughly across devices
8. Deploy to production