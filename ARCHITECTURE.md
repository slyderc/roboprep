# RoboPrep Architecture Documentation

This document provides comprehensive technical documentation for the RoboPrep web application architecture, including component design, data flow, and implementation details.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Component Architecture](#component-architecture)
- [Data Flow & State Management](#data-flow--state-management)
- [API Layer Design](#api-layer-design)
- [Database Architecture](#database-architecture)
- [Authentication & Security](#authentication--security)
- [Build System & Configuration](#build-system--configuration)
- [Theme System](#theme-system)
- [Performance Considerations](#performance-considerations)
- [Development Patterns](#development-patterns)

## Overview

RoboPrep is a modern web application built with Next.js 14 that helps radio DJs create AI-powered show preparation content. The architecture follows a client-server model with React components, Next.js API routes, SQLite database persistence, and OpenAI integration.

### Key Architectural Principles

- **Component-Based Design**: Modular React components with clear responsibilities
- **API-First Architecture**: RESTful API design with Next.js API routes
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Security by Design**: Multi-layered security with authentication, validation, and bot protection
- **Performance Optimization**: Code splitting, lazy loading, and optimized builds
- **Responsive Design**: Mobile-first approach with consistent theming

## Technology Stack

### Frontend Framework
- **React 18.2**: Component-based UI library with hooks
- **Next.js 14.2**: Full-stack React framework with App Router
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **React Context API**: State management for global app state

### Backend & API
- **Next.js API Routes**: Server-side API endpoints
- **Prisma ORM**: Type-safe database client and query builder
- **SQLite**: File-based relational database
- **JWT**: JSON Web Tokens for authentication

### External Integrations
- **OpenAI API**: GPT-4o integration for content generation
- **Cloudflare Turnstile**: Bot protection for forms
- **bcryptjs**: Password hashing and security

### Development Tools
- **TypeScript**: Type safety and enhanced development experience
- **ESLint**: Code linting and style enforcement
- **Prisma Studio**: Database visualization and management
- **Puppeteer MCP**: Browser automation for testing

## Application Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│  React Components │ Context Providers │ Client-Side Logic   │
├─────────────────────────────────────────────────────────────┤
│                    HTTP/API Layer                           │
├─────────────────────────────────────────────────────────────┤
│              Next.js Server (API Routes)                    │
├─────────────────────────────────────────────────────────────┤
│   Prisma ORM   │  Authentication  │   Business Logic       │
├─────────────────────────────────────────────────────────────┤
│                   SQLite Database                           │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/webpage/
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma         # Database model definitions
│   └── migrations/           # Database migration files
├── scripts/                  # Database management and utilities
│   ├── upgrade-db-standalone.js  # Database upgrade tool
│   ├── init-db.js           # Database initialization
│   └── populate-db.js       # Default data population
├── public/                   # Static assets
│   └── assets/              # Icons, logos, images
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.jsx       # Root layout component
│   │   ├── page.jsx         # Home page
│   │   ├── login/           # Authentication pages
│   │   ├── register/        # User registration
│   │   ├── admin/           # Admin dashboard
│   │   └── api/             # API route handlers
│   │       ├── auth/        # Authentication endpoints
│   │       ├── admin/       # Admin API endpoints
│   │       ├── openai/      # OpenAI integration
│   │       └── db/          # Database operations
│   ├── components/          # React components
│   │   ├── ui/              # Base UI components
│   │   └── [feature-components]  # Feature-specific components
│   ├── context/             # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and services
│   ├── data/                # Static data and configurations
│   └── styles/              # Global CSS and theme definitions
└── [config files]           # Next.js, Tailwind, ESLint configs
```

## Component Architecture

### Component Hierarchy

```
App Layout (layout.jsx)
├── Authentication Provider (AuthContext)
├── Settings Provider (SettingsContext)
├── Prompt Provider (PromptContext)
└── Page Components
    ├── HomePage
    │   ├── Header
    │   ├── CategoryList
    │   ├── TagFilter
    │   ├── PromptList
    │   │   └── PromptCard[]
    │   └── Modals
    │       ├── VariableModal
    │       ├── ResponseModal
    │       ├── NewPromptModal
    │       └── SettingsModal
    ├── LoginPage
    │   ├── TurnstileWidget
    │   └── PasswordStrengthIndicator
    └── AdminPage
        ├── DbStatsPanel
        ├── DatabaseManagement
        └── UserManagement
```

### Core Components

#### Layout Components
- **`layout.jsx`**: Root layout with providers and global styles
- **`Header.jsx`**: Navigation, theme toggle, user menu
- **`HomePage.jsx`**: Main application container

#### Prompt Management
- **`CategoryList.jsx`**: Category navigation with smart ordering
- **`TagFilter.jsx`**: Tag-based filtering with AND logic
- **`PromptList.jsx`**: Main prompt display with filtering
- **`PromptCard.jsx`**: Individual prompt cards with actions
- **`NewPromptModal.jsx`**: Create/edit prompts with tag management

#### AI Integration
- **`VariableModal.jsx`**: Variable replacement interface
- **`ResponseModal.jsx`**: Display and manage AI responses
- **`ResponseHistoryModal.jsx`**: Browse saved responses
- **`ResponseListModal.jsx`**: Multiple response management

#### Authentication & Security
- **`TurnstileWidget.jsx`**: Bot protection component
- **`PasswordStrengthIndicator.jsx`**: Real-time password validation
- **`EmailValidator.jsx`**: Email format validation

#### Admin Interface
- **`DbStatsPanel.jsx`**: Database statistics and management
- **`DatabaseManagement.jsx`**: Database upgrade interface
- **`AccountInfo.jsx`**: User account management

#### Base UI Components
- **`Button.jsx`**: Standardized button component
- **`Input.jsx`**: Form input components with validation
- **`Modal.jsx`**: Reusable modal wrapper

### Component Design Patterns

#### Props Pattern
```javascript
// Example: PromptCard component
interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onToggleFavorite: (promptId: string) => void;
  onCopy: (text: string) => void;
  onSubmitToAI: (prompt: Prompt) => void;
}
```

#### Hook Pattern
```javascript
// Example: Custom hook usage
const useTurnstile = (siteKey: string) => {
  // Environment detection
  // Widget management
  // Token retrieval
  // Cleanup handling
};
```

#### Context Pattern
```javascript
// Example: Authentication context
const AuthContext = createContext({
  user: null,
  isAdmin: false,
  login: async (credentials) => {},
  logout: async () => {},
  register: async (userData) => {}
});
```

## Data Flow & State Management

### State Management Architecture

```
Global State (React Context)
├── AuthContext
│   ├── User authentication state
│   ├── Login/logout functions
│   └── Admin status
├── SettingsContext
│   ├── Theme preferences
│   ├── Font size settings
│   └── User preferences
└── PromptContext
    ├── Prompts data
    ├── Categories and tags
    ├── Favorites and recently used
    ├── AI responses
    └── CRUD operations
```

### Data Flow Patterns

#### Authentication Flow
```
1. User Input → TurnstileWidget → AuthContext
2. AuthContext → API Route → Database
3. Database → JWT Token → Secure Cookie
4. Cookie → AuthContext → Component State
```

#### Prompt Management Flow
```
1. User Action → Component → PromptContext
2. PromptContext → Storage API → Database API
3. Database API → Prisma → SQLite
4. Response → PromptContext → Component Update
```

#### AI Integration Flow
```
1. Prompt + Variables → VariableModal → OpenAI API
2. OpenAI API → Response Processing → Database Storage
3. Database Storage → ResponseModal → User Display
```

### API Client Architecture

```javascript
// API Client wrapper with error handling
export async function fetchWithErrorHandling(url, options, operation) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
        return;
      }
      // Handle other errors
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, operation);
    throw error;
  }
}
```

## API Layer Design

### API Route Structure

```
/api/
├── auth/                    # Authentication endpoints
│   ├── login/              # POST: User login
│   ├── register/           # POST: User registration
│   ├── logout/             # POST: Session termination
│   ├── me/                 # GET: Current user info
│   └── change-password/    # POST: Password updates
├── admin/                  # Admin-only endpoints
│   ├── users/              # User management
│   │   ├── route.js        # GET: List users, POST: Create user
│   │   └── [id]/           # User-specific operations
│   │       ├── route.js    # PUT: Update, DELETE: Remove
│   │       ├── approve/    # POST: Approve user
│   │       ├── reset-password/  # POST: Admin password reset
│   │       └── toggle-admin/    # POST: Toggle admin status
│   └── database/           # Database management
│       └── route.js        # GET: Status, POST: Upgrades
├── openai/                 # AI integration
│   └── route.js           # POST: Send prompts to OpenAI
└── db/                    # Database operations
    └── route.js           # POST: All database operations
```

### API Design Patterns

#### RESTful Design
```javascript
// Standard REST operations
GET    /api/admin/users          # List all users
POST   /api/admin/users          # Create new user
GET    /api/admin/users/[id]     # Get specific user
PUT    /api/admin/users/[id]     # Update user
DELETE /api/admin/users/[id]     # Delete user
```

#### Operation-Based API
```javascript
// Database operations API
POST /api/db
{
  "operation": "getPrompts",
  "params": { "category": "news" }
}
```

#### Error Handling Pattern
```javascript
// Consistent error responses
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "details": { "userId": "123" }
}
```

### API Security

- **Authentication**: JWT tokens in HTTP-only cookies
- **Authorization**: Role-based access control (admin/user)
- **Input Validation**: Comprehensive server-side validation
- **Rate Limiting**: Turnstile integration for bot protection
- **CORS**: Configured for appropriate origins
- **SQL Injection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Input sanitization and CSP headers

## Database Architecture

### Schema Design

See [DATABASE.md](DATABASE.md) for comprehensive database documentation including:
- Complete schema definitions
- Relationship mappings
- Migration system
- Performance optimization
- Backup and recovery

### Data Access Patterns

#### Prisma Client Usage
```javascript
// Relationship loading
const promptsWithTags = await prisma.prompt.findMany({
  include: {
    tags: {
      include: {
        tag: true
      }
    },
    responses: {
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }
  }
});
```

#### Database Abstraction Layer
```javascript
// Storage API maintains localStorage compatibility
const storage = {
  get: async (keys) => dbRequest('getSetting', { key: keys }),
  set: async (items) => dbRequest('setSetting', items),
  remove: async (keys) => dbRequest('removeSetting', { keys })
};
```

## Authentication & Security

### Authentication Architecture

```
Registration/Login Flow:
1. Client Form → Turnstile Validation
2. Server Validation → Password Hashing
3. User Creation → Admin Approval (if required)
4. JWT Generation → Secure Cookie
5. Session Storage → Database
```

### Security Layers

#### Client-Side Security
- **Input Validation**: Real-time form validation
- **XSS Prevention**: Sanitized user inputs
- **CSRF Protection**: SameSite cookie attributes
- **Bot Protection**: Turnstile integration

#### Server-Side Security
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Security**: Secure token generation and validation
- **Session Management**: Database-stored sessions with expiration
- **API Authorization**: Middleware-based access control

#### Database Security
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **Data Encryption**: Sensitive data hashing
- **Access Control**: User-specific data isolation
- **Backup Security**: Automated backup creation

### Security Components

#### Turnstile Integration
```javascript
// useTurnstile hook
const useTurnstile = (siteKey) => {
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  // Environment detection
  const isProduction = process.env.NODE_ENV === 'production';
  const hasTurnstileSecret = !!process.env.TURNSTILE_SECRET_KEY;
  
  // Widget management and token retrieval
};
```

## Build System & Configuration

### Build Optimization

#### Build Scripts
```json
{
  "scripts": {
    "build": "DISABLE_ESLINT_PLUGIN=true NEXT_TELEMETRY_DISABLED=1 next build",
    "build:quiet": "DISABLE_ESLINT_PLUGIN=true NEXT_TELEMETRY_DISABLED=1 CI=true next build",
    "build:strict": "next build"
  }
}
```

#### Next.js Configuration
```javascript
// next.config.js optimizations
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  }
};
```

### Environment Configuration

#### Environment Variables
```bash
# Application Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
DATABASE_URL="file:../roboprep.db"
DATABASE_TARGET_VERSION="2.1.0"

# Security Configuration
JWT_SECRET="your-secure-secret"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# Build Configuration
DISABLE_ESLINT_PLUGIN=true
NEXT_TELEMETRY_DISABLED=1
```

## Theme System

### CSS Variables Architecture

```css
/* Light theme (default) */
:root {
  --background-color: #f9fafb;
  --surface-color: #ffffff;
  --text-color: #1f2937;
  --primary-color: #3b82f6;
  --border-color: #e5e7eb;
}

/* Dark theme */
.dark-theme {
  --background-color: #1a1a1a;
  --surface-color: #2a2a2a;
  --text-color: #f3f4f6;
  --primary-color: #60a5fa;
  --border-color: #374151;
}
```

### Theme Management

#### SettingsContext Implementation
```javascript
const SettingsContext = createContext({
  theme: 'light',
  fontSize: 'medium',
  toggleTheme: () => {},
  setFontSize: (size) => {}
});
```

#### Theme Toggle Component
```javascript
const ThemeToggle = () => {
  const { theme, toggleTheme } = useSettings();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
```

## Performance Considerations

### Optimization Strategies

#### Code Splitting
- **Page-level splitting**: Next.js automatic code splitting
- **Component-level splitting**: React.lazy for large components
- **Library splitting**: Separate vendor chunks

#### Data Loading
- **Efficient queries**: Prisma relation loading
- **Caching**: React state caching for frequently accessed data
- **Pagination**: Large dataset pagination support

#### Bundle Optimization
- **Tree shaking**: Unused code elimination
- **Minification**: Production bundle minification
- **Compression**: Gzip/Brotli compression

### Performance Monitoring

#### Metrics Tracking
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **Database Performance**: Query execution time tracking
- **API Response Times**: Endpoint performance monitoring

## Development Patterns

### Code Organization

#### File Naming Conventions
- **Components**: PascalCase (e.g., `PromptCard.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTurnstile.js`)
- **Utilities**: camelCase (e.g., `apiClient.js`)
- **Constants**: UPPER_SNAKE_CASE

#### Import Organization
```javascript
// External libraries
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Internal components
import { Button } from '@/components/ui/Button';
import PromptCard from '@/components/PromptCard';

// Utilities and hooks
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/lib/toastUtil';
```

### Error Handling Patterns

#### Component Error Boundaries
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }
}
```

#### API Error Handling
```javascript
const handleApiError = (error, operation, showToast = true) => {
  const errorMessage = error.message || 'An unexpected error occurred';
  
  if (showToast) {
    showToast(errorMessage, 'error');
  }
  
  console.error(`API Error in ${operation}:`, error);
};
```

### Testing Patterns

#### Component Testing
```javascript
// Example test structure
describe('PromptCard', () => {
  test('renders prompt information correctly', () => {
    // Test implementation
  });
  
  test('handles click events properly', () => {
    // Test implementation
  });
});
```

#### API Testing
- **Unit tests**: Individual API route testing
- **Integration tests**: End-to-end API flow testing
- **Database tests**: Prisma query testing

### Code Quality

#### ESLint Configuration
- **React rules**: React-specific linting
- **Next.js rules**: Next.js best practices
- **Custom rules**: Project-specific requirements

#### TypeScript Integration
- **Type definitions**: Strong typing for components and APIs
- **Interface definitions**: Clear contract definitions
- **Generic types**: Reusable type patterns

## Deployment Architecture

### Production Environment
- **Build optimization**: Minified, tree-shaken bundles
- **Environment configuration**: Production-specific settings
- **Security hardening**: Production security measures
- **Database management**: Automated backups and upgrades

### Development Environment
- **Hot reloading**: Fast development iteration
- **Development tools**: Debugging and inspection tools
- **Test data**: Development-specific data sets
- **Local database**: SQLite file-based development

This architecture documentation provides a comprehensive technical overview of the RoboPrep application. For database-specific details, see [DATABASE.md](DATABASE.md). For user-facing information, see [README.md](README.md). For development guidance when working with Claude Code, see [CLAUDE.md](CLAUDE.md).