# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a web application version of "Robo Show Prep from RadioDJ Dude". The tool helps radio DJs quickly generate AI-powered show preparation content through a library of customizable prompts that DJs can use to create radio-ready content like artist bios, music facts, weather reports, and various show segments. The web application now features direct OpenAI integration for generating content without leaving the app.

## Repository Structure

- Root directory: Contains the documentation
- `/webpage/` directory: Contains the Next.js web application version with OpenAI API integration

## Technology Stack

- **Frontend Framework**: React with Next.js 14
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT-based multi-user authentication with bcrypt password hashing
- **Security**: Cloudflare Turnstile bot protection for registration and login
- **Data Persistence**: SQLite database with Prisma ORM
- **API Layer**: Next.js API routes
- **AI Integration**: OpenAI API integration
- **Build System**: Optimized build process with warning suppression

## Key Components

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
   - **Database upgrade system**: Comprehensive schema migration framework with version tracking

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

6. **Security & Authentication**
   - Cloudflare Turnstile integration for bot protection
   - JWT-based session management with secure cookies
   - User approval workflow: new users require administrator approval
   - Comprehensive password validation with real-time feedback
   - Reusable Turnstile components and hooks for consistent implementation
   - Environment-based security (production vs. development)
   - User session isolation and secure password storage

## Core Files

- `/webpage/prisma/`: Database schema and migrations
  - `schema.prisma`: Database model definitions
- `/webpage/src/app/`: Next.js app router pages and layout
  - `/api/auth/`: Authentication endpoints (login, register, logout)
  - `/api/admin/`: Admin interface endpoints for user management and database upgrades
  - `/api/admin/database/`: Database management and upgrade API endpoint
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
  - `TurnstileWidget.jsx`: Reusable Turnstile security component
  - `PasswordStrengthIndicator.jsx`: Real-time password validation feedback
  - `EmailValidator.jsx`: Comprehensive email validation component
  - `DatabaseManagement.jsx`: Database upgrade management interface for admin
  - `AccountInfo.jsx`: User account information and management
- `/webpage/src/hooks/`: Custom React hooks
  - `useTurnstile.js`: Reusable hook for Turnstile integration and bot protection
- `/webpage/src/context/`: React Context providers
  - `PromptContext.jsx`: Handles prompt and response management
  - `AuthContext.jsx`: Handles user authentication and session management
  - `SettingsContext.jsx`: User preferences and theme management
- `/webpage/src/lib/`: Utility functions and helpers
  - `db.js`: Database connection and helper functions with upgrade system
  - `storage.js`: Database wrapper with localStorage-compatible API
  - `openaiService.js`: OpenAI API integration
  - `apiClient.js`: Client-side API wrapper
  - `auth.js`: Authentication utilities and JWT handling
  - `turnstile.js`: Turnstile verification and security utilities
  - `validation.js`: Comprehensive form validation with security-focused rules
  - `toastUtil.js`: Toast notification management
- `/webpage/scripts/`: Database management and upgrade scripts
  - `upgrade-db-standalone.js`: Standalone database upgrade tool with CLI interface
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
DATABASE_INIT_VERSION="2.0.0"
DATABASE_TARGET_VERSION="2.1.0"

# Authentication settings
JWT_SECRET="your-secure-random-secret-key"
JWT_EXPIRATION="12h"
COOKIE_NAME="robo_auth"
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true

# Cloudflare Turnstile Settings (Production Only)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
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

## Database Upgrade System

### Overview
The application includes a comprehensive database upgrade framework designed to handle schema changes while preserving all existing data. This system is production-ready and reusable for future database modifications.

### Key Features
- **Version Tracking**: Database version stored in `DatabaseInfo` table
- **Incremental Upgrades**: Support for sequential version upgrades (2.0.0 → 2.1.0 → 2.2.0)
- **Automatic Backups**: Database backed up before any upgrade operation
- **Data Preservation**: All existing data maintained during schema changes
- **Multiple Interfaces**: CLI tools and web admin interface for upgrades
- **Safety Features**: Rollback protection and verification checks

### Available Tools

#### CLI Commands
```bash
# Check if database upgrade is needed
npm run db:check

# Perform database upgrade (with automatic backup)
npm run db:upgrade

# Force upgrade regardless of current status
node scripts/upgrade-db-standalone.js --force
```

#### Web Admin Interface
- Access: `/admin` page → Database Management section
- Features: Real-time status, visual upgrade interface, environment info
- API endpoint: `/api/admin/database` for status and upgrade operations

### Current Upgrade Path: 2.0.0 → 2.1.0
**Purpose**: Add user approval workflow
**Changes**:
- Adds `isApproved` column to User table
- Auto-approves all existing users to maintain functionality
- Updates database version to 2.1.0

### Extensibility Framework
The upgrade system is designed for easy extension with future schema changes:

1. **Update environment variables**: Set new `DATABASE_TARGET_VERSION`
2. **Create upgrade function**: Add `upgrade_X_X_X_to_Y_Y_Y()` function
3. **Update upgrade logic**: Add new version path to `upgradeDatabase()`
4. **Update Prisma schema**: Add new models/fields as needed

### Key Database Functions
- `getDatabaseVersion()`: Get current database version
- `checkUpgradeNeeded()`: Check if upgrade is available
- `upgradeDatabase(from, to)`: Perform database upgrade
- `getDbStats()`: Get database statistics for admin interface

### Safety and Production Features
- **Automatic backups**: Created before each upgrade
- **Column existence checking**: Prevents duplicate schema modifications
- **Transaction safety**: Changes applied atomically
- **Verification**: Post-upgrade validation confirms success
- **Environment awareness**: Works in both development and production

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

## Security & Bot Protection

### Turnstile Integration
The application includes Cloudflare Turnstile integration for bot protection on registration and login pages:

- **Environment-Aware**: Automatically activates in production, bypasses in development
- **Reusable Architecture**: Uses `useTurnstile` hook and `TurnstileWidget` component
- **Fallback Token Retrieval**: Multiple methods to ensure token detection works reliably
- **Unique Callbacks**: Prevents conflicts when multiple widgets exist
- **Automatic Cleanup**: Proper widget removal to prevent memory leaks

### Turnstile Implementation Details

#### useTurnstile Hook (`/webpage/src/hooks/useTurnstile.js`)
Custom hook that provides:
- Environment detection (production vs. development)
- Widget initialization and cleanup
- Token validation with fallback retrieval
- Unique callback management to prevent conflicts

#### TurnstileWidget Component (`/webpage/src/components/TurnstileWidget.jsx`)
Reusable component that:
- Renders Turnstile widget in production
- Shows development bypass message in local development
- Handles responsive layout and theming
- Provides consistent UI across all forms

#### Security Features
- **Production Only**: Turnstile only activates when `TURNSTILE_SECRET_KEY` exists and not in local development
- **IP Verification**: Backend validates Turnstile tokens with client IP addresses
- **Rate Limiting**: Built-in protection against rapid-fire requests
- **Token Uniqueness**: Each widget gets unique callback names to prevent interference

## User Approval Workflow

### Administrator Approval System
The application implements a comprehensive user approval workflow:

- **New User Registration**: All new users (except the first admin) require administrator approval
- **Approval Process**: New users can register but cannot access the application until approved
- **Admin Dashboard**: Dedicated "Needs Approval" section for pending user accounts
- **Approval Actions**: Administrators can approve or delete pending users
- **User Communication**: Clear messaging to users about approval status

### Approval Implementation Details

#### Database Schema
- `isApproved` field added to User model with default `false`
- First user (admin) is automatically approved
- Admin-created users are automatically approved

#### Security Features
- Login blocked for unapproved users with informative error messages
- Registration success shows approval pending message
- Admin interface restricted to approved admin users only

## Form Validation System

### Comprehensive Validation Framework
The application includes robust client and server-side validation:

#### Password Validation (`validation.js`)
- **Minimum Requirements**: 8+ characters, uppercase, lowercase, number, special character
- **Security-Safe Characters**: Only allows `!@#$%^&*()_+-=[]{}|;:,.<>?`
- **Real-time Feedback**: Live password strength indicator with visual checklist
- **Unsafe Character Prevention**: Blocks SQL injection and XSS characters

#### Email Validation
- **Comprehensive Checks**: Format validation, length limits, domain validation
- **Security Filtering**: Prevents dangerous characters and consecutive dots
- **Real-time Validation**: Instant feedback as users type

#### Visual Validation Features
- **Inline Checkmarks**: Green checkmarks appear inside input fields when valid
- **Color-coded Borders**: Green for valid, red for invalid inputs
- **Clean Interface**: Removed redundant warning messages for decluttered UI
- **Blue Incomplete Items**: Better readability for uncompleted requirements

#### Form Submission Controls
- **Sign-in Page**: Button disabled until email validation, password entry, and Turnstile completion
- **Registration Page**: Comprehensive validation for all fields before enabling submission
- **Server-side Validation**: Matching validation logic on backend for security

### Build System Optimizations

The application includes optimized build configurations:

#### Available Build Scripts
- `npm run build`: Production build with warning suppression (recommended)
- `npm run build:quiet`: Minimal output for CI/CD environments
- `npm run build:strict`: Full warnings for debugging

#### Build Configuration Features
- **ESLint Suppression**: `DISABLE_ESLINT_PLUGIN=true` for faster builds
- **Telemetry Disabled**: `NEXT_TELEMETRY_DISABLED=1` for privacy
- **Warning Filtering**: Configured to show only critical errors
- **Clean Output**: Stderr redirection with fallback for cleaner console output

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
- `TurnstileWidget.jsx`: Reusable Turnstile security widget with environment detection
- `PasswordStrengthIndicator.jsx`: Real-time password validation with visual feedback
- `EmailValidator.jsx`: Comprehensive email validation with inline indicators
- `AccountInfo.jsx`: User account information and management interface

Key design patterns:
- Consistent styling between light and dark modes
- Interactive elements with clear visual feedback
- Responsive layouts that adapt to different screen sizes
- Semantic component organization following React best practices
- Shared utility functions for common operations

### Adding New Features

When adding new features:
1. Use Tailwind CSS for styling
2. Follow established patterns for state management
3. Consider creating reusable hooks (like `useTurnstile`) for complex logic
4. Create reusable components for consistent UI patterns
5. Update this guide if necessary
6. Ensure both light and dark themes are supported
7. Test in both development and production environments
8. Consider security implications, especially for authentication-related features

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
   - **Database upgrades**: Use `npm run db:check` and `npm run db:upgrade` for schema migrations
   - **Admin database management**: Web interface at `/admin` for database status and upgrades

5. **OpenAI Integration**:
   - API key management through environment variables
   - Response storage and editing
   - Error handling and retry logic for rate limits
   - New response generation without closing the modal

6. **Security and Authentication**:
   - Turnstile integration using `useTurnstile` hook and `TurnstileWidget` component
   - JWT session management with secure cookies
   - User registration and login with bot protection
   - Environment-based security configuration
   - Admin interface for user management

## Testing

### Web Application
1. Run the development server with `npm run dev`
2. Database setup:
   - Verify the SQLite database is initialized with `npx prisma studio`
   - Check that the default categories and core prompts are loaded
   - Test database upgrade commands: `npm run db:check` and `npm run db:upgrade`
   - Verify admin database management interface displays correct status
3. UI and theme testing:
   - Test in both light and dark themes
   - Verify consistent styling across all components
   - Verify responsive behavior at different screen sizes

### Browser Testing with Puppeteer MCP
Claude Code has access to a Puppeteer MCP interface that can be used for browser automation and testing:

**Available Puppeteer Tools**:
- `mcp__puppeteer-mcp-server__puppeteer_connect_active_tab`: Connect to existing Chrome instance
- `mcp__puppeteer-mcp-server__puppeteer_navigate`: Navigate to URLs
- `mcp__puppeteer-mcp-server__puppeteer_screenshot`: Take screenshots for visual verification
- `mcp__puppeteer-mcp-server__puppeteer_click`: Click elements
- `mcp__puppeteer-mcp-server__puppeteer_fill`: Fill forms
- `mcp__puppeteer-mcp-server__puppeteer_select`: Select dropdown options
- `mcp__puppeteer-mcp-server__puppeteer_hover`: Hover over elements
- `mcp__puppeteer-mcp-server__puppeteer_evaluate`: Execute JavaScript in browser console

**Usage for RoboPrep Testing**:
- Navigate to `http://localhost:3000` to test the application
- Take screenshots of different pages and themes for visual verification
- Test form interactions (login, registration, prompt creation)
- Verify admin dashboard functionality
- Test responsive behavior by evaluating viewport changes
- Automate user workflows (login → navigate → interact → verify)
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
7. Security and authentication:
   - Test user registration and login with Turnstile verification
   - Verify user approval workflow (registration → approval → login)
   - Test password validation with all security requirements
   - Verify email validation with various input formats
   - Test form submission controls (disabled until all validation passes)
   - Verify bot protection works in production environment
   - Test JWT session management and logout functionality
   - Verify admin interface access controls and approval actions
   - Test password hashing and security measures
8. Build system:
   - Test different build configurations (`npm run build`, `build:quiet`, `build:strict`)
   - Verify warning suppression works correctly
   - Check that production builds include all necessary files
   - Test that development and production environments behave correctly
