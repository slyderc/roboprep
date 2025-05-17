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
- Star/favorite frequently used prompts
- Track recently used prompts

### OpenAI Integration (Web App)
- Submit prompts directly to OpenAI's GPT-4o model
- Replace variables before submitting to AI
- Save and manage AI responses
- Browse response history for each prompt
- Include responses in import/export functionality

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
- **Data Persistence**: localStorage (client-side)
- **AI Integration**: OpenAI API with Next.js API routes

### Project Architecture

#### Application Structure
```
/webpage/
├── public/
│   ├── assets/
│   │   ├── icons/
│   │   └── logo/
├── src/
│   ├── app/
│   │   ├── page.jsx            # Main entry point
│   │   ├── layout.jsx          # Main layout component
│   │   └── api/
│   │       └── openai/         # API routes for OpenAI
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── CategoryList.jsx    # Category navigation
│   │   ├── PromptCard.jsx      # Individual prompt card
│   │   ├── NewPromptModal.jsx  # Create/edit prompt modal
│   │   ├── VariableModal.jsx   # Variable replacement modal
│   │   ├── ResponseModal.jsx   # Display OpenAI responses
│   │   ├── ResponseHistoryModal.jsx # View saved responses
│   │   └── ...
│   ├── context/
│   │   ├── PromptContext.jsx   # Core data management
│   │   └── SettingsContext.jsx # User preferences
│   ├── lib/
│   │   ├── storage.js          # LocalStorage wrapper
│   │   ├── importExportUtil.js # Import/export functionality
│   │   ├── apiClient.js        # Client-side API wrapper
│   │   └── ...
│   ├── data/
│   │   └── prompts.json        # Default prompts
│   └── styles/
│       └── globals.css         # Global styles with theme variables
```

### Data Management

#### Storage Keys
- `userPrompts`: Array of user-created prompts
- `corePrompts`: Array of built-in prompts
- `favorites`: Array of IDs for favorited prompts
- `recentlyUsed`: Array of IDs for recently used prompts
- `userCategories`: Array of user-created categories
- `settings`: Object containing user preferences (theme, font size, etc.)
- `aiResponses`: Array of AI-generated responses

#### Storage Implementation
The web application uses a wrapper around the browser's localStorage API to mimic a Chrome extension's storage API for compatibility:

```javascript
// src/lib/storage.js
const storage = {
  get: async (keys) => {
    const result = {};
    // Implementation mimics Chrome's storage.local.get
    return result;
  },
  set: async (items) => {
    // Implementation mimics Chrome's storage.local.set
  },
  // Response-specific methods
  getResponses: async () => {
    const result = await storage.get({ 'aiResponses': [] });
    return result.aiResponses;
  },
  saveResponse: async (response) => {
    const responses = await storage.getResponses();
    // Save the response and return it
  },
};
```

### OpenAI Integration

The web application provides integration with OpenAI's GPT-4o model through a secure API:

#### API Configuration
Environment variables control the OpenAI integration:
```
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_MAX_TOKENS=2048
NEXT_PUBLIC_OPENAI_TEMPERATURE=0.7
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

## Development Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenAI API key (for AI features in web app)

## Running the Projects

### Web Application
1. Navigate to the `/webpage` directory
2. Install dependencies with `npm install`
3. Create a `.env.local` file with your OpenAI API key and settings
4. Run the development server with `npm run dev`
5. Open your browser to `http://localhost:3000`
6. For production build, use `npm run build`

