# Robo Show Prep - Web Application

This is the web application version of the Robo Show Prep tool for radio DJs. For a comprehensive overview of the project including both the Chrome extension and this web application, please refer to the [main README](../README.md) in the project root.

## Web-Specific Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between color themes with preferences saved
- **Client-Side Only**: No server required, runs entirely in the browser
- **Modern UI**: Built with React and Tailwind CSS

## Technology Stack

- **Frontend Framework**: React with Next.js 14
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Context API
- **Data Persistence**: localStorage (client-side)

## Development Prerequisites

- Node.js 18.x or later
- npm or yarn

## Quick Start

1. Navigate to the webpage directory:
   ```bash
   cd webpage
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
│   │   └── layout.jsx          # Main layout component
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── CategoryList.jsx    # Category navigation
│   │   ├── PromptCard.jsx      # Individual prompt card
│   │   ├── NewPromptModal.jsx  # Create/edit prompt modal
│   │   ├── VariableModal.jsx   # Variable replacement modal
│   │   └── ...
│   ├── context/
│   │   ├── PromptContext.jsx   # Core data management
│   │   └── SettingsContext.jsx # User preferences
│   ├── lib/
│   │   ├── storage.js          # LocalStorage wrapper
│   │   ├── importExportUtil.js # Import/export functionality
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

## Building for Production

```bash
npm run build
```

The resulting build can be deployed to any static hosting provider.

## Contributing

For contributing guidelines, please see the main project README.