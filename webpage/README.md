# Robo Show Prep - Web Application

This is the web application version of the Robo Show Prep tool for radio DJs. For a comprehensive overview of the project including both the Chrome extension and this web application, please refer to the [main README](../README.md) in the project root.

## Web-Specific Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between color themes with preferences saved
- **Client-Side Only**: No server required, runs entirely in the browser
- **Modern UI**: Built with React and Tailwind CSS
- **OpenAI Integration**: Submit prompts directly to OpenAI's GPT-4o model and save responses

## Technology Stack

- **Frontend Framework**: React with Next.js 14
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Context API
- **Data Persistence**: localStorage (client-side)
- **AI Integration**: OpenAI API with Next.js API routes

## Development Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenAI API key (for AI features)

## Quick Start

1. Navigate to the webpage directory:
   ```bash
   cd webpage
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the webpage directory:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
   NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
   NEXT_PUBLIC_OPENAI_MAX_TOKENS=2048
   NEXT_PUBLIC_OPENAI_TEMPERATURE=0.7
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
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
│   │   ├── openaiService.js    # OpenAI API service
│   │   ├── apiClient.js        # Client-side API wrapper
│   │   └── ...
│   ├── data/
│   │   └── prompts.json        # Default prompts
│   └── styles/
│       └── globals.css         # Global styles with theme variables
```

## Implementation Notes

### Storage Wrapper

The web application uses a wrapper around the browser's localStorage API to mimic the Chrome extension's storage API for compatibility:

```javascript
// src/lib/storage.js
const storage = {
  get: async (keys) => {
    const result = {};
    // Implementation mimics Chrome's storage.local.get
    // ...
    return result;
  },
  set: async (items) => {
    // Implementation mimics Chrome's storage.local.set
    // ...
  },
  // Response-specific methods
  getResponses: async () => {
    const result = await storage.get({ 'aiResponses': [] });
    return result.aiResponses;
  },
  saveResponse: async (response) => {
    const responses = await storage.getResponses();
    // Save the response and return it
    // ...
  },
  // ...
};
```

### Theme System

The application implements a theme system using CSS variables and React context:

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

### OpenAI Integration

The application provides integration with OpenAI's GPT-4o model:

```javascript
// src/lib/openaiService.js
export async function submitToOpenAI(promptText, variables = {}) {
  // Process variables and prepare the prompt
  const processedPrompt = replaceVariables(promptText, variables);
  
  // Send request to OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI assistant helping radio DJs create show content.' },
        { role: 'user', content: processedPrompt }
      ],
      // other parameters...
    })
  });
  
  // Process and return the response
  // ...
}
```

#### Response Structure

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

## Building for Production

```bash
npm run build
```

The resulting build can be deployed to any static hosting provider that supports Next.js API routes (for OpenAI integration). For static-only hosts, you'll need to modify the application to use edge functions or serverless functions for the OpenAI API calls.

## Contributing

For contributing guidelines, please see the main project README.