# RoboPrep Database Architecture

This document provides an overview of the database architecture used in the RoboPrep web application. The application has migrated from using localStorage to a relational database for improved data management and scalability.

## Technology Stack

- **Database**: SQLite (file-based)
- **ORM**: Prisma
- **API Layer**: Next.js API Routes
- **Client Integration**: Fetch API
- **Authentication**: JWT tokens with secure cookie storage

## Database Schema

### Core Models

#### DatabaseInfo
Tracks the database version for migration purposes.
```prisma
model DatabaseInfo {
  id          Int      @id @default(1)
  version     String
  updatedAt   DateTime @updatedAt
}
```

#### User
Stores user accounts for authentication and user-specific data.
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Hashed password
  firstName     String?
  lastName      String?
  isAdmin       Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  settings      UserSetting[]
  favorites     UserFavorite[]
  recentlyUsed  UserRecentlyUsed[]
  sessions      Session[]
}
```

#### Session
Manages user authentication sessions.
```prisma
model Session {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### UserSetting
Stores user-specific settings.
```prisma
model UserSetting {
  id        String  @id @default(cuid())
  userId    String
  key       String
  value     String  // JSON string for setting values
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, key])
}
```

#### Prompt
Stores both core (built-in) and user-created prompts.
```prisma
model Prompt {
  id           String    @id
  title        String
  description  String?
  categoryId   String?
  promptText   String
  tags         PromptTag[]
  isUserCreated Boolean
  usageCount   Int       @default(0)
  createdAt    DateTime
  lastUsed     DateTime?
  lastEdited   DateTime?
  responses    Response[]
  favorites    Favorite[]
  userFavorites UserFavorite[]
  recentlyUsed RecentlyUsed[]
  userRecentlyUsed UserRecentlyUsed[]
}
```

#### Category
Stores prompt categories, both core and user-created.
```prisma
model Category {
  id            String  @id
  name          String
  isUserCreated Boolean @default(false)
}
```

#### Tag
Stores tags associated with prompts.
```prisma
model Tag {
  id      String     @id @default(cuid())
  name    String     @unique
  prompts PromptTag[]
}
```

#### PromptTag
Junction table for the many-to-many relationship between prompts and tags.
```prisma
model PromptTag {
  promptId String
  tagId    String
  prompt   Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  tag      Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([promptId, tagId])
}
```

#### UserFavorite
Stores user-specific favorite prompts.
```prisma
model UserFavorite {
  id       String @id @default(cuid())
  userId   String
  promptId String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompt   Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@unique([userId, promptId])
}
```

#### UserRecentlyUsed
Tracks user-specific recently used prompts with timestamps.
```prisma
model UserRecentlyUsed {
  id        String   @id @default(cuid())
  userId    String
  promptId  String
  usedAt    DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompt    Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@unique([userId, promptId])
  @@index([usedAt])
}
```

#### Response
Stores AI-generated responses to prompts.
```prisma
model Response {
  id              String    @id
  promptId        String
  responseText    String
  modelUsed       String?
  promptTokens    Int?
  completionTokens Int?
  totalTokens     Int?
  createdAt       DateTime
  lastEdited      DateTime?
  variablesUsed   String?   // JSON string for variable values
  prompt          Prompt    @relation(fields: [promptId], references: [id], onDelete: Cascade)
}
```

#### Legacy Models
These models are maintained for backward compatibility:

```prisma
// Global Favorites (legacy, maintained for backward compatibility)
model Favorite {
  id       String @id @default(cuid())
  promptId String
  prompt   Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@unique([promptId])
}

// Global Recently Used (legacy, maintained for backward compatibility)
model RecentlyUsed {
  id        String   @id @default(cuid())
  promptId  String
  prompt    Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  usedAt    DateTime @default(now())

  @@index([usedAt])
}

// Global Settings (legacy, maintained for backward compatibility)
model Setting {
  key   String @id
  value String // JSON string for setting values
}
```

## Authentication Implementation

The application implements a robust authentication system with the following features:

1. **User Account Management**:
   - Secure registration with email validation
   - Password encryption using bcrypt
   - Login/logout functionality
   - Password reset capabilities
   - User profile management

2. **Session Management**:
   - JWT-based authentication
   - Secure HTTP-only cookies for token storage
   - 12-hour session expiration
   - Session invalidation on logout

3. **Authorization**:
   - Role-based access control (admin vs. regular user)
   - Protected API routes requiring authentication
   - Administrative functions restricted to admin users

4. **Security Measures**:
   - Password hashing with bcrypt
   - CSRF protection
   - Rate limiting for login attempts
   - Session fixation prevention
   - XSS protection

## Multi-User Data Isolation

The database schema is designed to support multi-user environments with proper data isolation:

1. **User-Specific Data**:
   - Each user has their own favorites (UserFavorite)
   - Each user has their own recently used prompts (UserRecentlyUsed)
   - Each user has their own settings (UserSetting)
   - Authentication data is stored securely (User, Session)

2. **Shared Data**:
   - All prompts are accessible to all users
   - AI responses are shared among all users
   - Categories and tags are global

3. **Data Migration Strategy**:
   - Legacy tables (Favorite, RecentlyUsed, Setting) are maintained for backward compatibility
   - New user-specific tables contain user-linked data

## Implementation Details

### Tag Filtering Implementation

The database schema supports tag-based filtering through a many-to-many relationship:

1. **Database Structure**:
   - Tags are stored in a separate `Tag` table with unique tag names
   - The `PromptTag` junction table manages many-to-many relationships between prompts and tags
   - This allows prompts to have multiple tags and tags to be associated with multiple prompts

2. **Tag Data Flow**:
   - When creating or updating prompts, tags are extracted and stored:
     - Existing tags are reused to prevent duplication
     - New tags are created when needed
     - Prompt-tag relationships are stored in the junction table
   - When retrieving prompts, tags are included with each prompt using Prisma's relation queries
   - Tag data is transformed from database format to a simple string array for frontend use

3. **Tag Filtering Logic**:
   - Tag filtering is implemented client-side after data is retrieved from the database
   - The UI filters prompts to only show those with ALL selected tags (AND logic)
   - This provides a powerful refinement mechanism when combined with category filtering

### Category Organization

Categories in the database support both system-defined and user-created categories:

1. **Database Structure**:
   - Categories are stored in the `Category` table with a unique ID and name
   - The `isUserCreated` flag distinguishes between system and user categories
   - Each prompt references a single category through the `categoryId` field

2. **Special Categories**:
   - "All Prompts", "Recently Used", and "Favorites" are virtual categories handled by the application logic
   - These don't exist as database records but are generated from database queries:
     - "All Prompts" - Shows all prompts regardless of category
     - "Recently Used" - Generated from the `UserRecentlyUsed` table (user-specific)
     - "Favorites" - Generated from the `UserFavorite` table (user-specific)

3. **Category Organization**:
   - Category order is managed through client-side logic
   - The application loads categories from the database and then applies sorting rules
   - Categories starting with numbers are sorted numerically, then remaining categories alphabetically

### Authentication Flow

The authentication system follows these key flows:

1. **Registration Flow**:
   - User submits registration form with email and password
   - Server validates input and checks for existing email
   - Password is hashed using bcrypt
   - New user record is created in the database
   - Initial user settings are created
   - JWT token is generated and sent to the client
   - User is logged in automatically

2. **Login Flow**:
   - User submits login form with email and password
   - Server validates credentials against the database
   - On successful validation, a new session is created
   - JWT token is generated with user ID and admin status
   - Token is stored in an HTTP-only cookie
   - User is redirected to the main application

3. **Authentication Check Flow**:
   - Client makes requests with the JWT cookie
   - Server middleware validates the JWT token
   - If valid, the user's ID is attached to the request
   - If invalid or expired, the user is redirected to login
   - Protected routes/APIs check for the authenticated user

4. **User Administration Flow**:
   - Admin users can access the user management interface
   - Interface allows creating new users, resetting passwords, and enabling/disabling accounts
   - Only users with admin flag can access these functions

### Client-Server Architecture

The database implementation follows a client-server architecture:

1. **Server-side**: Next.js API routes handle database operations using Prisma
2. **Client-side**: JavaScript code makes API requests to the server
3. **Abstraction Layer**: Storage API maintains compatibility with previous code

This architecture keeps Prisma on the server-side only, avoiding browser compatibility issues.

### API Layer

Database operations are handled through a central API endpoint at `/api/db`:

```javascript
// API route in src/app/api/db/route.js
export async function POST(request) {
  try {
    const { operation, params } = await request.json();
    
    // Handle different database operations
    switch (operation) {
      case 'getSetting':
        return await handleGetSetting(params);
      case 'getSettings':
        return await handleGetSettings(params);
      // ... more operation handlers
    }
  } catch (error) {
    // Error handling
  }
}
```

Operations are dispatched to individual handler functions that interact with the Prisma client.

### Authentication API Endpoints

Authentication is handled through dedicated API routes:

```javascript
// Authentication API routes structure
/api/auth/
  ├─ register/ - Handles user registration
  ├─ login/ - Handles user login
  ├─ logout/ - Handles user logout
  ├─ me/ - Gets current user data
  ├─ change-password/ - Handles password changes
  └─ reset-password/ - Handles password resets
```

### Client-Side Storage API

The storage API in `src/lib/storage.js` maintains the same interface as before, but now translates calls into API requests and includes the authenticated user's context:

```javascript
// Helper function to make API requests
async function dbRequest(operation, params = {}) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, params }),
    credentials: 'include' // Important for authentication cookies
  };
  
  return fetchWithErrorHandling('/api/db', options, operation);
}

// Example storage API method
const storage = {
  get: async (keys) => {
    // Translate get request to API call
    if (typeof keys === 'string') {
      const data = await dbRequest('getSetting', { key: keys });
      return data;
    }
    // ... handle other cases
  },
  // ... other methods
};
```

### Error Handling

Robust error handling is implemented at multiple levels:

1. **API Routes**: Server-side error handling with appropriate HTTP status codes
2. **Client API Wrapper**: Utility for handling API responses and errors
3. **Storage API**: Fallback to defaults when errors occur
4. **Authentication Errors**: Specialized handling for authentication failures

The error handling utility provides consistent formatting and user feedback:

```javascript
export async function fetchWithErrorHandling(url, options, operation, showToastOnError = true) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Handle authentication errors specifically
      if (response.status === 401) {
        // Redirect to login page if unauthenticated
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      // Process other error responses
      // ...
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, operation, showToastOnError);
    throw error;
  }
}
```

### Database Initialization

The database is initialized with the `initializeDatabase()` function in `src/lib/db.js`, now including initial admin user creation:

```javascript
export async function initializeDatabase() {
  try {
    // Check if the DatabaseInfo record exists
    const dbInfo = await prisma.databaseInfo.findUnique({
      where: { id: 1 },
    });

    // If not, create it with the initial version
    if (!dbInfo) {
      await prisma.databaseInfo.create({
        data: {
          id: 1,
          version: process.env.DATABASE_INIT_VERSION || '2.0.0',
        },
      });
      console.log(`Database initialized with version ${process.env.DATABASE_INIT_VERSION || '2.0.0'}`);
      
      // Create initial admin user
      const hashedPassword = await bcrypt.hash('RoboPrepMe', 12);
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          isAdmin: true,
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      console.log('Created initial admin user');
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}
```

### Data Migration Strategy

For existing installations, data migration follows these steps:

1. **User Creation**: Create a default admin user
2. **Settings Migration**: Move global settings to user-specific settings
3. **Favorites Migration**: Copy global favorites to the default user's favorites
4. **Recently Used Migration**: Copy global recently used items to the default user's recently used

This approach ensures a smooth transition from single-user to multi-user without data loss.

## Environment Configuration

Database and authentication configuration is managed through environment variables:

```
# Database Settings
DATABASE_URL="file:../roboprep.db"
DATABASE_POOL_SIZE=5
DATABASE_INIT_VERSION="2.0.0"

# Authentication Settings
JWT_SECRET="your-secure-random-secret"
JWT_EXPIRATION="12h"
COOKIE_NAME="robo_auth"
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
```

These settings can be configured in the `.env.local` file.

## Versioning

The database includes version tracking to manage future schema changes:

- Version is stored in the `DatabaseInfo` table
- The version is set during initial database creation
- Functions `getDatabaseVersion()` and `updateDatabaseVersion()` manage version information

## Benefits of the Multi-User Architecture

1. **User Isolation**: Proper separation of user data for favorites, recent usage, and settings
2. **Security**: Modern authentication with JWT and secure cookie handling
3. **Scalability**: Support for multiple users with proper data isolation
4. **Administration**: User management capabilities for administrative users
5. **Flexibility**: Shared content with individualized user experiences
6. **Migration Path**: Backward compatibility with legacy data structures

## Future Considerations

### Database Management
- Database backups and restoration functionality
- More advanced migration strategies for schema changes
- Potential cloud database support
- Performance optimizations for larger datasets
- Caching strategies for frequently accessed data

### Authentication Enhancements
- OAuth integration for social login
- Two-factor authentication
- Email verification
- Account lockout after failed attempts
- More granular permission system

### Multi-User Enhancements
- User groups and team features
- Sharing prompts between users
- User activity tracking and analytics
- User preferences for OpenAI integration
- User quota management

### Tag System Enhancements
- Server-side tag filtering for improved performance with large datasets
- Tag analytics to show most commonly used tags
- Tag suggestion system based on prompt content analysis
- Advanced filtering options:
  - Support for OR logic (show prompts with ANY selected tag)
  - Exclusion filtering (hide prompts with specific tags)
  - Filter persistence across sessions
  - Tag category grouping or hierarchical tags

### Category Improvements
- Custom category ordering (drag-and-drop reordering)
- Category color coding or icons
- Nested subcategories for more organizational flexibility
- Category-based permission system for multi-user environments