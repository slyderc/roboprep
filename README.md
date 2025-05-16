# Robo Show Prep

A tool that helps radio DJs quickly create radio-ready show prep content using AI prompts, available as both a Chrome extension and a web application.

## Project Overview

This repository contains two versions of the Robo Show Prep tool:

1. **Chrome Extension** (in the root directory) - Built with Chrome Extension Manifest V3
2. **Web Application** (in the `/webpage` directory) - Built with Next.js and React

Both versions share the same core functionality and data structures, allowing users to manage and utilize AI prompts for radio show preparation.

## Features

### Prompt Management
- Store and organize prompts for radio show preparation
- Create custom prompts using variables for customization
- Categorize prompts into predefined and custom categories
- Star/favorite frequently used prompts
- Track recently used prompts

### Prompt Variables
- Use template variables in the format `{{variable_name}}` 
- Variables get replaced when using the prompt
- Special handling for time-related variables (duration, length)

### Theming
- Light mode (default)
- Dark mode with optimized contrast and readability
- Font size customization (small, medium, large)
- Theme preferences saved in user settings

### Import/Export Functionality

#### Export
Export all custom prompts as a JSON file:
- Click the Settings icon and select "Export" from the Data Management section
- Exports in a standardized format with a timestamp
- Format: 
  ```json
  { 
    "type": "DJPromptsExport", 
    "version": "1.0", 
    "timestamp": "ISO date string", 
    "prompts": [array of prompt objects] 
  }
  ```
- Exported files are named `dj_prompts_export_YYYY-MM-DD.json`

#### Import
Import prompt packs with duplicate detection:
- Click the Settings icon and select "Import" from Data Management
- Select a JSON file in the correct format
- The system checks for duplicates by comparing title and content
- Shows a report of successfully imported prompts and any duplicates skipped
- Validates the file format (must contain `type: "DJPromptsExport"` and a `prompts` array)

## Technical Details

### Chrome Extension
- Built with Chrome Extension Manifest V3
- Provides both popup and sidebar interfaces
- Implements clipboard integration for prompt copying
- Uses Chrome's local storage for data persistence

### Web Application
- Built with React and Next.js
- Responsive design for all device sizes
- Uses localStorage for data persistence
- Compatible with modern browsers
- Mimics the Chrome extension's storage API for data consistency

## Storage

Both versions store the following data structures:
- `userPrompts`: Array of user-created prompts
- `corePrompts`: Array of built-in prompts
- `favorites`: Array of IDs for favorited prompts
- `recentlyUsed`: Array of IDs for recently used prompts
- `userCategories`: Array of user-created categories
- `settings`: Object containing user preferences (theme, font size, etc.)

## Prompt Structure

Each prompt is stored with the following structure:
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

## Running the Projects

### Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable Developer Mode
3. Click "Load unpacked" and select the root directory of this project
4. The extension will appear in your extensions list

### Web Application
1. Navigate to the `/webpage` directory
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open your browser to `http://localhost:3000`
5. For production build, use `npm run build`