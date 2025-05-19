# RoboPrep Database Architecture

This document provides an overview of the database architecture used in the RoboPrep web application. The application has migrated from using localStorage to a relational database for improved data management and scalability.

## Technology Stack

- **Database**: SQLite (file-based)
- **ORM**: Prisma
- **API Layer**: Next.js API Routes
- **Client Integration**: Fetch API

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
  recentlyUsed RecentlyUsed[]
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

#### Favorite
Stores user-favorited prompts.
```prisma
model Favorite {
  id       String @id @default(cuid())
  promptId String
  prompt   Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@unique([promptId])
}
```

#### RecentlyUsed
Tracks recently used prompts with timestamps.
```prisma
model RecentlyUsed {
  id        String   @id @default(cuid())
  promptId  String
  prompt    Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  usedAt    DateTime @default(now())

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

#### Setting
Stores application settings as key-value pairs.
```prisma
model Setting {
  id    Int    @id @default(1)
  key   String @unique
  value String // JSON string for setting values
}
```

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
     - "Recently Used" - Generated from the `RecentlyUsed` table
     - "Favorites" - Generated from the `Favorite` table

3. **Category Organization**:
   - Category order is managed through client-side logic
   - The application loads categories from the database and then applies sorting rules
   - Categories starting with numbers are sorted numerically, then remaining categories alphabetically

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

### Client-Side Storage API

The storage API in `src/lib/storage.js` maintains the same interface as before, but now translates calls into API requests:

```javascript
// Helper function to make API requests
async function dbRequest(operation, params = {}) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, params }),
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

The error handling utility provides consistent formatting and user feedback:

```javascript
export async function fetchWithErrorHandling(url, options, operation, showToastOnError = true) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Process error response
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

The database is initialized with the `initializeDatabase()` function in `src/lib/db.js`:

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
          version: process.env.DATABASE_INIT_VERSION || '1.0.0',
        },
      });
      console.log(`Database initialized with version ${process.env.DATABASE_INIT_VERSION || '1.0.0'}`);
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}
```

### Data Import/Export

The application supports importing and exporting data as JSON files:

1. **Export**: Retrieves data from the database via the API and creates a JSON file
2. **Import**: Reads a JSON file and sends the data to the API for storage

The import functionality includes validation and duplicate checking to ensure data integrity.

## Environment Configuration

Database configuration is managed through environment variables:

```
# Database Settings
DATABASE_URL="file:../roboprep.db"
DATABASE_POOL_SIZE=5
DATABASE_INIT_VERSION="1.0.0"
```

These settings can be configured in the `.env.local` file.

## Versioning

The database includes version tracking to manage future schema changes:

- Version is stored in the `DatabaseInfo` table
- The version is set during initial database creation
- Functions `getDatabaseVersion()` and `updateDatabaseVersion()` manage version information

## Benefits of the New Architecture

1. **Relational Data Model**: Proper foreign key relationships and data integrity
2. **Improved Query Performance**: Optimized database queries vs. loading everything into memory
3. **Scalability**: Better handling of larger datasets
4. **Type Safety**: Prisma provides type checking and validation
5. **Migration Support**: Structured approach to database schema changes
6. **Transaction Support**: Atomic operations for data consistency
7. **Browser Compatibility**: No Prisma code runs in the browser
8. **Security**: Database operations are isolated to the server

## Refreshing Data in React Context

To ensure imported data appears without requiring a page reload, we've implemented a data refresh pattern:

```javascript
// PromptContext.jsx
async function refreshData() {
  try {
    const data = await storage.get({
      'userPrompts': [],
      'corePrompts': defaultPrompts,
      'favorites': [],
      'recentlyUsed': [],
      'userCategories': [],
      'settings': { fontSize: 'medium' },
      'aiResponses': []
    });
    
    setUserPrompts(data.userPrompts);
    setCorePrompts(data.corePrompts);
    setFavorites(data.favorites);
    setRecentlyUsed(data.recentlyUsed);
    setUserCategories(data.userCategories);
    setSettings(data.settings);
    setResponses(data.aiResponses);
    
    return true;
  } catch (error) {
    console.error('Error refreshing data:', error);
    return false;
  }
}
```

This function is used after major data operations like imports to ensure the React state reflects the current database state:

```javascript
// SettingsModal.jsx - Import handling
if (result.success && (result.newPromptsCount > 0 || result.responsesCount > 0)) {
  // Apply a loading state while refreshing data
  showToast('Refreshing data...', 'info');
  
  setTimeout(async () => {
    // Refresh data from the database
    const refreshSuccess = await refreshData();
    
    if (refreshSuccess) {
      showToast('Data refreshed successfully');
      onClose();
    } else {
      showToast('Error refreshing data. Please reload the page.', 'error');
    }
  }, 1000);
}
```

This approach replaces the previous method of forcing a page reload after import operations, resulting in a smoother user experience.

## Future Considerations

### Database Management
- Database backups and restoration functionality
- More advanced migration strategies for schema changes
- Potential cloud database support
- Performance optimizations for larger datasets
- Caching strategies for frequently accessed data

### Multi-User Support
- Authentication and authorization for multi-user environments
- User-specific settings, favorites, and recent prompts
- Optimized data refresh patterns for larger datasets

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