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

- **Frontend Framework**: React with Next.js 14
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT-based multi-user authentication
- **Data Persistence**: SQLite database with Prisma ORM
- **API Layer**: Next.js API routes
- **AI Integration**: OpenAI API integration

### Key Components

1. **User Interface**
   - Single-page responsive application with dark/light theme support
   - Individual prompt cards with clean, modern styling and visual feedback
   - Static categories sidebar that remains visible while scrolling
   - "FILTER BY TAGS" panel for refining prompt lists
   - Standardized styling between light and dark themes
   - Color-coded action buttons across modals for better usability
   - Visual indicators for prompts without variables
   - Attribution links to original creators

2. **Navigation and Organization**
   - Smart category organization with prioritized system categories
   - Tag-based filtering with AND logic (all selected tags must be present)
   - Visual indicators for active filters and categories
   - Category list with "All Prompts", "Recently Used", and "Favorites" at the top
   - Alphabetical sorting for regular categories (numeric prefixes sorted first)

3. **Data Management**
   - SQLite database with Prisma ORM
   - Multi-user authentication with JWT sessions
   - User-specific data isolation (favorites, recently used, responses)
   - Admin interface for user management
   - API routes for database operations
   - Storage.js wrapper that maintains compatibility with previous API
   - Support for import/export functionality including OpenAI responses
   - Response history browsing with editing capabilities

4. **OpenAI Integration**
   - Direct submission of prompts to OpenAI's API
   - Variable replacement before submitting to AI
   - Response storage and management
   - Response editing with version tracking
   - Multiple-response viewing and history

5. **Theme System**
   - Light mode (default) and dark mode support
   - Consistent color theming throughout the application
   - Theme preference saved in user settings
   - CSS variables for responsive sizing and theming

### Core Files

- `/webpage/prisma/`: Database schema and migrations
  - `schema.prisma`: Database model definitions
- `/webpage/src/app/`: Next.js app router pages and layout
  - `/api/auth/`: Authentication endpoints (login, register, logout)
  - `/api/admin/`: Admin interface endpoints for user management
  - `/api/openai/`: API route for OpenAI integration
  - `/api/db/`: API routes for database operations
- `/webpage/src/components/`: UI components
  - `CategoryList.jsx`: Category navigation with smart ordering
  - `PromptList.jsx`: Displays filtered prompts
  - `TagFilter.jsx`: Tag-based filtering interface
  - `PromptCard.jsx`: Individual prompt display
  - `ResponseModal.jsx`: Displays OpenAI responses
  - `ResponseHistoryModal.jsx`: Manages saved responses
  - `ResponseListModal.jsx`: Lists all responses for a prompt
- `/webpage/src/context/`: React Context providers
  - `PromptContext.jsx`: Handles prompt and response management
  - `AuthContext.jsx`: Handles user authentication and session management
- `/webpage/src/lib/`: Utility functions and helpers
  - `db.js`: Database connection and helper functions
  - `storage.js`: Database wrapper with localStorage-compatible API
  - `openaiService.js`: OpenAI API integration
  - `apiClient.js`: Client-side API wrapper
  - `auth.js`: Authentication utilities and JWT handling
- `/webpage/src/styles/`: Global CSS and theme definitions
  - `globals.css`: Contains theme variables and global styles

## OpenAI Integration

### Environment Setup

The web application requires OpenAI API credentials and authentication settings to be configured in a `.env.local` file:
```
# OpenAI API settings
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_MAX_TOKENS=2048
NEXT_PUBLIC_OPENAI_TEMPERATURE=0.7

# Database settings
DATABASE_URL="file:../roboprep.db"

# Authentication settings
JWT_SECRET="your-secure-random-secret-key"
JWT_EXPIRATION="12h"
```

### Response Structure

AI responses are stored with the following structure:
```javascript
{
  "id": "response_1234567890",           // Unique identifier
  "promptId": "associated_prompt_id",    // ID of the prompt that generated this response
  "userId": "user_id",                   // ID of the user who created this response
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

## Recent UI Improvements

### Visual Feedback and Button Styling
The application now includes enhanced visual feedback:

- **Color-coded Action Buttons**: Consistent button colors across all modals
  - Cancel/Close: Red (`bg-red-600`)
  - Copy: Blue (`bg-blue-600`) or Purple (`bg-purple-600`)
  - Submit/Save: Green (`bg-green-600`)
  - Preview: Blue with eye icon (`bg-blue-600`)
  - New Response: Purple (`bg-purple-600`)

- **Prompt Card Indicators**: 
  - Visual indicators for prompts without variables
  - Informative tooltips explaining interaction behavior
  - Hover effects for clickable elements

- **Button Layout**: 
  - Cancel buttons positioned on the far left
  - Action buttons grouped on the right
  - Consistent spacing and sizing

### Updated Placeholder Examples
Variable placeholders now use modern, relevant examples:
- Artist: "Urban Heat" 
- Song: "Shake The Disease"
- Album: "Violator"
- Station: "KEXP"
- City: "Seattle"
- Genre: "goth, synth-wave, indie-rock, etc."

## Future Development

### API Implementation Plan
A comprehensive API implementation plan has been created (`API_IMPLEMENTATION_PLAN.md`) that outlines:
- RESTful API interface for all UI functionality
- API key management system
- Database schema extensions for API access
- Security and rate limiting considerations
- Migration strategy from current architecture

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

The web application uses these key components:
- `CategoryList.jsx`: Smart category navigation with prioritized ordering
- `PromptList.jsx`: Main component that displays filtered prompts
- `TagFilter.jsx`: Interface for filtering prompts by tags with AND logic
- `PromptCard.jsx`: Displays individual prompts with tag badges and actions
- `VariableModal.jsx`: Handles variable replacement for copy and AI submission
- `NewPromptModal.jsx`: UI for creating/editing prompts with tag management
- `ResponseModal.jsx`: Displays and manages OpenAI responses
- `ResponseHistoryModal.jsx`: Displays saved response history with editing
- `ResponseListModal.jsx`: Lists all responses for a prompt with variables display

Key design patterns:
- Consistent styling between light and dark modes
- Interactive elements with clear visual feedback
- Responsive layouts that adapt to different screen sizes
- Semantic component organization following React best practices
- Shared utility functions for common operations

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
   - Consistent styling between light and dark themes for all components

2. **Tag and Category Management**:
   - Tag filtering through the "FILTER BY TAGS" panel
   - Smart category organization with prioritized categories
   - Creating new prompts with multiple tags
   - Editing prompt tags through the edit modal
   - Tags support AND logic filtering (all selected tags must be present)

3. **Import/Export**:
   - Export functionality saves user prompts and AI responses to a JSON file
   - Import validates the JSON format and checks for duplicates
   - Both are accessible from the Settings modal with options for including responses
   - Tags and categories are preserved during import/export

4. **Database Operations**:
   - Data persistence through SQLite with Prisma ORM
   - API routes for database access
   - Compatibility layer in storage.js that maintains the same API as localStorage
   - Many-to-many relationships for tags and prompts

5. **OpenAI Integration**:
   - API key management through environment variables
   - Response storage and editing
   - Error handling and retry logic for rate limits
   - New response generation without closing the modal

## Testing

### Chrome Extension
1. Load the extension in Chrome's developer mode
2. Open the popup and sidebar interfaces
3. Test all prompt functionality
4. Verify data persistence using Chrome's storage inspector

### Web Application
1. Run the development server with `npm run dev`
2. Database setup:
   - Verify the SQLite database is initialized with `npx prisma studio`
   - Check that the default categories and core prompts are loaded
3. UI and theme testing:
   - Test in both light and dark themes
   - Verify consistent styling across all components
   - Verify responsive behavior at different screen sizes
4. Feature testing:
   - Test tag filtering with multiple tag selections (AND logic)
   - Verify category organization ("All Prompts", "Recently Used", and "Favorites" at top)
   - Test import/export functionality with and without responses
   - Verify database persistence of all changes
5. AI integration:
   - Test OpenAI integration with variable replacement
   - Verify "New Response" functionality without closing the modal
   - Test response history browsing and editing
   - Verify response deletion functionality
6. Error handling:
   - Verify proper error handling for API failures
   - Test database connection error recovery
   - Verify graceful handling of missing environment variables