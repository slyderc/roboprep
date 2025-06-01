# Robo Show Prep

A tool that helps radio DJs quickly create radio-ready show prep content using AI prompts.

## License

This project is licensed under the MIT License with Attribution - see the [LICENSE.md](LICENSE.md) file for details.

When using this code, you must:
- Include the original copyright notice
- Provide attribution to Now Wave Radio (https://nowwave.radio)
- Reference the original codebase repository (https://github.com/slyderc/roboprep)

## Features

### Prompt Management
- Store and organize prompts for radio show preparation
- Create custom prompts using variables for customization
- Categorize prompts into predefined and custom categories
- Filter prompts by tags to quickly find relevant content
- Star/favorite frequently used prompts
- Track recently used prompts
- Smart category organization with "All Prompts", "Recently Used", and "Favorites" prioritized

### OpenAI Integration (Web App)
- Submit prompts directly to OpenAI's GPT-4o model
- Replace variables before submitting to AI
- Save and manage AI responses
- Browse response history for each prompt
- Include responses in import/export functionality

### Security & Authentication
- Multi-user authentication system with JWT-based sessions
- **User approval workflow**: New users require administrator approval before access
- **Comprehensive form validation**: Real-time password and email validation with security filtering
- Cloudflare Turnstile bot protection for registration and login (production only)
- User-specific data isolation for favorites, recently used, and responses
- Admin interface for user management, approval workflow, and system statistics
- Secure password hashing and session management with enhanced security measures

### Prompt Variables
- Use template variables in the format `{{variable_name}}` 
- Variables get replaced when using the prompt
- Special handling for time-related variables (duration, length)

### Theming
- Light mode (default)
- Dark mode with optimized contrast and readability
- Font size customization (small, medium, large)
- Theme preferences saved in user settings

### Form Validation & User Experience
- **Real-time Password Validation**: Live feedback with visual strength indicator and requirements checklist
- **Email Validation**: Comprehensive email format validation with security filtering
- **Visual Feedback**: Green checkmarks appear inside input fields when validation passes
- **Clean Interface**: Decluttered forms with inline validation indicators instead of redundant messages
- **Security-Focused**: Only allows safe special characters and prevents dangerous input patterns
- **Form Submission Controls**: Buttons disabled until all validation requirements are met

### Import/Export Functionality

#### Export
Export all custom prompts as a JSON file:
- Click the Settings icon and select "Export" from the Data Management section
- Exports in a standardized format with a timestamp
- Option to include AI responses in the export
- Format: 
  ```json
  { 
    "type": "DJPromptsExport", 
    "version": "2.0", 
    "timestamp": "ISO date string", 
    "prompts": [array of prompt objects],
    "responses": [array of AI response objects] 
  }
  ```
- Exported files are named `roboprep-export-YYYY-MM-DD.json`

#### Import
Import prompt packs with duplicate detection:
- Click the Settings icon and select "Import" from Data Management
- Select a JSON file in the correct format
- Option to include or exclude AI responses during import
- The system checks for duplicates by comparing title and content
- Shows a report of successfully imported prompts, responses, and any duplicates skipped
- Validates the file format (must contain `type: "DJPromptsExport"` and a `prompts` array)

## Technical Details

### Technology Stack

- **Frontend Framework**: React with Next.js 14
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Context API
- **Data Persistence**: SQLite database via Prisma ORM
- **AI Integration**: OpenAI API with Next.js API routes
- **Authentication**: JWT-based sessions with bcrypt password hashing
- **Security**: Cloudflare Turnstile bot protection
- **Build System**: Next.js with optimized warning suppression for production

### Category and Tag Organization

#### Smart Category Organization
The application uses an intelligent category organization system:

- Important categories are prioritized at the top:
  1. "All Prompts" - displays all available prompts
  2. "Recently Used" - shows prompts you've recently accessed
  3. "Favorites" - displays your starred prompts
- A visual separator divides primary categories from others
- Remaining categories are sorted intelligently:
  - Categories starting with numbers are listed first in numerical order (e.g., "1. News", "2. Weather")
  - Other categories are organized alphabetically
- Active category is visually highlighted for easy identification

#### Tag Filtering System
The application includes a tag-based filtering system that allows users to quickly find prompts by their associated tags:

- Filter prompts by selecting one or more tags from the "FILTER BY TAGS" panel
- Uses AND logic - displays only prompts that contain ALL selected tags
- Tag filters work alongside category filters for precise content discovery
- Visual indicators show which tags are currently active
- Reset button to quickly clear all active tag filters
- Consistent styling between light and dark themes

### Build System & Scripts

The application includes several build configurations optimized for different environments:

#### Available Build Commands

- **`npm run build`** - Production build with warning suppression (recommended)
  - Disables ESLint plugin during build for faster compilation
  - Suppresses telemetry collection
  - Redirects stderr to reduce console noise
  - Automatically falls back if stderr redirection fails

- **`npm run build:quiet`** - Minimal output build for CI/CD environments
  - Same optimizations as standard build
  - Sets CI=true for additional output reduction
  - Ideal for automated deployment pipelines

- **`npm run build:strict`** - Full warnings and errors (development)
  - Shows all ESLint warnings and TypeScript errors
  - Useful for debugging and development
  - Maintains original Next.js build behavior

- **`npm run lint`** - Run ESLint on the codebase
- **`npm run lint:errors`** - ESLint with zero tolerance for warnings

#### Build Configuration

The build system is configured to suppress most warnings while maintaining functionality:

**Next.js Configuration (`next.config.js`):**
```javascript
{
  eslint: {
    ignoreDuringBuilds: true,     // Skip ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: true,      // Ignore TypeScript errors during builds
  },
  logging: {
    fetches: {
      fullUrl: false,             // Reduce fetch URL logging
    },
  }
}
```

**Environment Variables for Builds:**
- `DISABLE_ESLINT_PLUGIN=true` - Completely disables ESLint plugin
- `NEXT_TELEMETRY_DISABLED=1` - Disables Next.js telemetry collection
- `CI=true` - Enables CI mode for quieter output

#### Build Output

**Clean Build (npm run build):**
```
✓ Compiled successfully
✓ Generating static pages (19/19)
[Clean build summary with route sizes]
```

**Versus Previous Output:**
```
⚠ Compiled with warnings
[Multiple warning messages about dependencies]
[Dynamic server usage errors for API routes]
[Configuration warnings]
```

### Project Architecture

#### Application Structure
```
/webpage/
├── prisma/
│   ├── schema.prisma        # Database schema definition
│   └── migrations/          # Database migrations
├── public/
│   ├── assets/
│   │   ├── icons/
│   │   └── logo/
├── src/
│   ├── app/
│   │   ├── page.jsx            # Main entry point
│   │   ├── layout.jsx          # Main layout component
│   │   ├── login/              # Login page with Turnstile integration
│   │   ├── register/           # Registration page with Turnstile
│   │   ├── admin/              # Admin dashboard
│   │   └── api/
│   │       ├── auth/           # Authentication API routes
│   │       ├── admin/          # Admin API routes
│   │       ├── openai/         # OpenAI API integration
│   │       └── db/             # Database API routes
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── CategoryList.jsx    # Category navigation
│   │   ├── PromptList.jsx      # Main prompt listing with filters
│   │   ├── TagFilter.jsx       # Tag filtering component
│   │   ├── PromptCard.jsx      # Individual prompt card
│   │   ├── NewPromptModal.jsx  # Create/edit prompt modal
│   │   ├── VariableModal.jsx   # Variable replacement modal
│   │   ├── ResponseModal.jsx   # Display OpenAI responses
│   │   ├── ResponseHistoryModal.jsx # View saved responses
│   │   ├── TurnstileWidget.jsx # Reusable Turnstile component
│   │   ├── AccountInfo.jsx     # User account information
│   │   └── ...
│   ├── hooks/
│   │   └── useTurnstile.js     # Custom hook for Turnstile integration
│   ├── context/
│   │   ├── PromptContext.jsx   # Core data management
│   │   ├── SettingsContext.jsx # User preferences
│   │   └── AuthContext.jsx     # Authentication state management
│   ├── lib/
│   │   ├── db.js               # Database connection module
│   │   ├── storage.js          # Database storage adapter
│   │   ├── auth.js             # Authentication utilities
│   │   ├── turnstile.js        # Turnstile verification utilities
│   │   ├── importExportUtil.js # Import/export functionality
│   │   ├── apiClient.js        # Client-side API wrapper
│   │   └── ...
│   ├── data/
│   │   └── prompts.json        # Default prompts
│   └── styles/
│       └── globals.css         # Global styles with theme variables
```

### Data Management

#### Database Structure
The application uses a SQLite database managed through Prisma ORM. See [DATABASE.md](DATABASE.md) for detailed documentation on the database schema and implementation.

Key tables include:
- `User`: Stores user accounts with authentication data
- `Session`: Manages user authentication sessions
- `Prompt`: Stores both core and user-created prompts
- `Category`: Stores prompt categories
- `Tag`: Stores tags associated with prompts
- `Response`: Stores AI-generated responses with user attribution
- `UserFavorite`: Tracks user-specific favorited prompts
- `UserRecentlyUsed`: Tracks user-specific recently used prompts
- `UserSetting`: Stores user-specific application settings
- `Setting`: Stores global application settings (legacy)

#### Storage API
The application provides a seamless interface for database operations that maintains compatibility with the previous localStorage-based implementation:

```javascript
const storage = {
  get: async (keys) => {
    // Fetch data from database based on the keys
    // Returns object with requested keys and values
  },
  
  set: async (items) => {
    // Save data to database
    // Handles special cases for different data types
  },
  
  remove: async (keys) => {
    // Remove data from database
  },
  
  // Additional helper methods for specific data types
  getResponses: async () => { /* ... */ },
  saveResponse: async (response) => { /* ... */ },
  // ...
};
```

### OpenAI Integration

The web application provides integration with OpenAI's GPT-4o model through a secure API:

#### API Configuration
Environment variables control the OpenAI integration, database settings, and authentication:
```
# OpenAI API settings
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_MAX_TOKENS=2048
NEXT_PUBLIC_OPENAI_TEMPERATURE=0.7

# Database settings
DATABASE_URL="file:../roboprep.db"
DATABASE_POOL_SIZE=5
DATABASE_INIT_VERSION="2.0.0"

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

#### API Client
```javascript
// Client-side API wrapper for sending prompts to OpenAI
export async function sendPromptToOpenAI(promptText, variables = {}) {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, variables })
    });
    
    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending prompt to OpenAI:', error);
    throw error;
  }
}
```

#### API Route
```javascript
// API route handler for OpenAI requests
export async function POST(request) {
  try {
    const { prompt, variables } = await request.json();
    
    const response = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI assistant helping radio DJs create show content.' },
        { role: 'user', content: processVariables(prompt, variables) }
      ],
      temperature: parseFloat(process.env.NEXT_PUBLIC_OPENAI_TEMPERATURE || 0.7),
      max_tokens: parseInt(process.env.NEXT_PUBLIC_OPENAI_MAX_TOKENS || 2048),
    });
    
    // Process and return response...
  } catch (error) {
    // Error handling...
  }
}
```

### Theme System

The web application implements a theme system using CSS variables and React context:

```css
/* Light theme (default) */
:root {
  --background-color: #f9fafb;
  --surface-color: #ffffff;
  --text-color: #1f2937;
  /* ... */
}

/* Dark theme */
.dark-theme {
  --background-color: #1a1a1a;
  --surface-color: #2a2a2a;
  --text-color: #f3f4f6;
  /* ... */
}
```

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

## AI Response Structure

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
  "lastEdited": "2023-05-16T10:15:00Z",  // Timestamp of last edit (if edited)
  "user": {                              // User information (included in responses from the API)
    "firstName": "John",                 // First name of the user who created the response
    "lastName": "Doe"                    // Last name of the user who created the response
  }
}
```

## Latest Updates

- **🔐 User Approval Workflow**: New users require administrator approval before accessing the application
- **✅ Enhanced Form Validation**: Comprehensive real-time password and email validation with security filtering
- **🎨 UI/UX Improvements**: Decluttered interface with inline validation checkmarks and improved readability
- **🛡️ Security Enhancements**: Added Cloudflare Turnstile bot protection for registration and login
- **🔧 Code Optimization**: Refactored Turnstile implementation with reusable hooks and components
- **📦 Build System**: Optimized build process with warning suppression for cleaner production builds
- **👥 Multi-User Authentication**: Complete user account system with JWT-based sessions
- **📝 User Attribution**: Responses track and display which user created them
- **⚙️ Admin Dashboard**: Interface for user management, approval workflow, and database statistics
- **🔄 Reusable Components**: Created validation components, `useTurnstile` hook and `TurnstileWidget` component
- **🏷️ Tag Filtering**: Filter prompts by tags using AND logic for multiple tag selection
- **📊 Smart Category Organization**: Reorganized categories with prioritized essential categories
- **🎯 OpenAI Integration**: Improved response handling with ability to generate new responses
- **🗄️ Database Migration**: Converted from localStorage to SQLite with Prisma ORM

## Development Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenAI API key (for AI features in web app)

## Running the Projects

### Web Application
1. Navigate to the `/webpage` directory
2. Install dependencies with `npm install`
3. Create a `.env.local` file with your OpenAI API key, database settings, and authentication settings (see API Configuration section above)
4. Initialize the database with `npx prisma migrate dev`
5. Run the development server with `npm run dev`
6. Open your browser to `http://localhost:3000`
7. Log in with the default admin account (email: admin@example.com, password: RoboPrepMe) or register a new account
8. **Note**: New user accounts require admin approval before access - use the admin account to approve pending users

#### Production Deployment
1. **Build the application**: Use `npm run build` for a clean production build
2. **Start production server**: Use `npm start` to serve the built application
3. **Alternative builds**:
   - `npm run build:quiet` - Minimal output for CI/CD
   - `npm run build:strict` - Full warnings for debugging

#### Turnstile Configuration (Production)
For production deployments with bot protection:
1. Get Cloudflare Turnstile keys from your Cloudflare dashboard
2. Add the keys to your `.env.local` file:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
   TURNSTILE_SECRET_KEY=your_secret_key
   ```
3. Turnstile automatically activates in production and bypasses in development

### Database Management
- View the database schema in `prisma/schema.prisma`
- Create migrations with `npx prisma migrate dev --name <migration-name>`
- Reset the database with `npx prisma migrate reset`
- View database content with `npx prisma studio`
- Initialize the database with `npm run db:init`
- Populate with default data using `npm run db:populate`

If you encounter database errors when starting the application, try these steps:

1. Make sure the database file exists at `../roboprep.db` (one directory up from the project folder)
2. Reset the database using `npm run db:reset`
3. Check that Prisma migrations have been applied
4. Verify that the database contains default data by running `npm run db:populate`