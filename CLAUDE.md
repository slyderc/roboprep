# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains both a Chrome extension and a web application version of "Robo Show Prep from RadioDJ Dude". The tool helps radio DJs quickly generate AI-powered show preparation content through a library of customizable prompts that DJs can use to create radio-ready content like artist bios, music facts, weather reports, and various show segments. The web application now features direct OpenAI integration for generating content without leaving the app.

## Repository Structure

The repository is organized into two main sections:
- Root directory: Contains the original Chrome extension (manifest v3)
- `/webpage/` directory: Contains the newer Next.js web application version with OpenAI API integration

## Chrome Extension Architecture

### Key Components

1. **User Interface**
   - **Popup**: Quick access interface (`popup/popup.html`, `popup/popup.js`)
   - **Sidebar**: Persistent panel interface (`sidebar/sidebar.html`, `sidebar/sidebar.js`)
   - **Floating Window**: Expanded interface launched from either UI

2. **Data Management**
   - Prompt data is stored in Chrome's local storage
   - Data structures include:
     - `userPrompts`: User-created prompts
     - `corePrompts`: Built-in prompts loaded from `content/prompts.json`
     - `favorites`: IDs of favorited prompts
     - `recentlyUsed`: Recently used prompt IDs
     - `userCategories`: User-created categories
     - `settings`: User preferences

3. **Prompt System**
   - Prompts contain template variables in `{{variable_name}}` format
   - Variables are replaced with user input when prompts are used
   - Special handling for time-related variables

### Core Files

- `manifest.json`: Extension configuration
- `background.js`: Background service worker for initialization
- `popup/popup.js`: Main popup UI controller
- `sidebar/sidebar.js`: Sidebar panel controller
- `content/prompts.json`: Pre-defined prompts
- `components/*.js`: Reusable UI components

## Web Application Architecture

### Technology Stack

- **Frontend Framework**: React with Next.js
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Data Persistence**: localStorage (client-side)
- **AI Integration**: OpenAI API via Next.js API routes

### Key Components

1. **User Interface**
   - Single-page responsive application with dark/light theme support
   - Individual prompt cards with clean, modern styling
   - Static categories sidebar that remains visible while scrolling
   - Adapted from the Chrome extension's UI patterns
   - Attribution links to original creators

2. **Data Management**
   - Uses localStorage with a wrapper that mimics Chrome's storage API
   - Maintains the same data structures as the extension with additions for AI responses
   - Support for import/export functionality including OpenAI responses
   - Response history browsing with editing capabilities

3. **OpenAI Integration**
   - Direct submission of prompts to OpenAI's API
   - Variable replacement before submitting to AI
   - Response storage and management
   - Response editing with version tracking
   - Multiple-response viewing and history

4. **Theme System**
   - Light mode (default) and dark mode support
   - Consistent color theming throughout the application
   - Theme preference saved in user settings

### Core Files

- `/webpage/src/app/`: Next.js app router pages and layout
  - `/api/openai/`: API route for OpenAI integration
- `/webpage/src/components/`: UI components
  - `ResponseModal.jsx`: Displays OpenAI responses
  - `ResponseHistoryModal.jsx`: Manages saved responses
  - `ResponseListModal.jsx`: Lists all responses for a prompt
- `/webpage/src/context/`: React Context providers
  - `PromptContext.jsx`: Handles prompt and response management
- `/webpage/src/lib/`: Utility functions and helpers
  - `openaiService.js`: OpenAI API integration
  - `apiClient.js`: Client-side API wrapper
  - `storage.js`: Extended for AI responses
- `/webpage/src/styles/`: Global CSS and theme definitions

## OpenAI Integration

### Environment Setup

The web application requires OpenAI API credentials to be configured in a `.env.local` file:
```
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_MAX_TOKENS=2048
NEXT_PUBLIC_OPENAI_TEMPERATURE=0.7
```

### Response Structure

AI responses are stored with the following structure:
```javascript
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
  },
  "lastEdited": "2023-05-16T10:15:00Z"   // Timestamp of last edit (if edited)
}
```

### AI Workflow

1. User clicks "Submit to AI" on a prompt card
2. If prompt has variables, the variable modal opens for customization
3. The prompt (with replaced variables) is sent to OpenAI via the API route
4. Response is displayed in a modal with options to save
5. Saved responses can be viewed, edited, and managed via response history
6. Responses can be exported along with prompts

## Development Guidelines

### Working with Prompts

Each prompt has the following structure:
```javascript
{
  "id": "unique_id",
  "title": "Prompt Title",
  "description": "Short description",
  "category": "category-slug",
  "promptText": "The actual prompt text with {{variables}}",
  "tags": ["tag1", "tag2"],
  "isUserCreated": true/false,
  "usageCount": 0,
  "createdAt": "ISO date string",
  "lastUsed": "ISO date string",
  "lastEdited": "ISO date string"
}
```

When modifying prompts:
- Maintain the same structure for compatibility
- Follow the existing pattern for variable syntax: `{{variable_name}}`
- Keep radio-specific terminology consistent
- Ensure prompt texts are appropriate for radio show preparation

### UI Components

Both the extension and web app use similar components with shared patterns:
- `PromptCard.jsx`: Displays individual prompts with OpenAI integration
- `VariableModal.jsx`: Handles variable replacement for copy and AI submission
- `CategoryList.jsx`: Manages prompt categories in a static sidebar
- `NewPromptModal.jsx`: UI for creating new prompts
- `ResponseModal.jsx`: Displays and manages OpenAI responses
- `ResponseHistoryModal.jsx`: Displays saved response history with editing
- `ResponseListModal.jsx`: Lists all responses for a prompt with variables display

### Adding New Features

When adding new features:
1. Decide whether the feature belongs in both the extension and web app
2. Maintain consistent functionality between both versions when applicable
3. Use Tailwind CSS for styling
4. Follow established patterns for state management
5. Update this guide if necessary
6. Ensure both light and dark themes are supported

### Common Tasks

1. **Theme Management**:
   - Theme toggle is available in the header
   - Full theme settings in the settings modal
   - Dark mode colors use CSS variables defined in globals.css

2. **Import/Export**:
   - Export functionality saves user prompts and AI responses to a JSON file
   - Import validates the JSON format and checks for duplicates
   - Both are accessible from the Settings modal with options for including responses

3. **OpenAI Integration**:
   - API key management through environment variables
   - Response storage and editing
   - Error handling and retry logic for rate limits

## Testing

### Chrome Extension
1. Load the extension in Chrome's developer mode
2. Open the popup and sidebar interfaces
3. Test all prompt functionality
4. Verify data persistence using Chrome's storage inspector

### Web Application
1. Run the development server with `npm run dev`
2. Test in both light and dark themes
3. Verify responsive behavior at different screen sizes
4. Test import/export functionality with and without responses
5. Verify localStorage persistence
6. Test OpenAI integration with variable replacement
7. Test response history browsing and editing
8. Verify proper error handling for API failures