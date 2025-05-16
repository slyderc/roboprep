# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository now contains both a Chrome extension and a web application version of "Robo Show Prep from RadioDJ Dude". The tool helps radio DJs quickly generate AI-powered show preparation content through a library of customizable prompts that DJs can use to create radio-ready content like artist bios, music facts, weather reports, and various show segments.

## Repository Structure

The repository is organized into two main sections:
- Root directory: Contains the original Chrome extension (manifest v3)
- `/webpage/` directory: Contains the newer Next.js web application version

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

### Key Components

1. **User Interface**
   - Single-page responsive application with dark/light theme support
   - Adapted from the Chrome extension's UI patterns

2. **Data Management**
   - Uses localStorage with a wrapper that mimics Chrome's storage API
   - Maintains the same data structures as the extension
   - Support for import/export functionality

3. **Theme System**
   - Light mode (default) and dark mode support
   - Consistent color theming throughout the application
   - Theme preference saved in user settings

### Core Files

- `/webpage/src/app/`: Next.js app router pages and layout
- `/webpage/src/components/`: UI components
- `/webpage/src/context/`: React Context providers
- `/webpage/src/lib/`: Utility functions and helpers
- `/webpage/src/styles/`: Global CSS and theme definitions

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
- `PromptCard/promptCard.js`: Displays individual prompts
- `VariableModal/variableModal.js`: Handles variable replacement
- `CategoryList/categoryList.js`: Manages prompt categories
- `NewPromptModal/newPromptModal.js`: UI for creating new prompts
- `PromptDisplay/promptDisplay.js`: Controls how prompts are shown

### Adding New Features

When adding new features:
1. Decide whether the feature belongs in both the extension and web app
2. Maintain consistent functionality between both versions when applicable
3. Use Tailwind CSS for styling
4. Follow established patterns for state management
5. Update this guide if necessary

### Common Tasks

1. **Theme Management**:
   - Theme toggle is available in the header
   - Full theme settings in the settings modal
   - Dark mode colors use CSS variables defined in globals.css

2. **Import/Export**:
   - Export functionality saves user prompts to a JSON file
   - Import validates the JSON format and checks for duplicates
   - Both are accessible from the Settings modal

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
4. Test import/export functionality
5. Verify localStorage persistence