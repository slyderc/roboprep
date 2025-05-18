# RoboPrep Database Architecture

This document provides an overview of the database architecture used in the RoboPrep web application. The application has migrated from using localStorage to a relational database for improved data management and scalability.

## Technology Stack

- **Database**: SQLite (file-based)
- **ORM**: Prisma
- **Node.js Integration**: Native Prisma Client

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

### Database Initialization

The database is initialized with the `initializeDatabase()` function in `src/lib/db.js`. This function:
1. Checks if the database exists
2. If not, creates the database with the schema defined in Prisma
3. Creates the DatabaseInfo record with an initial version

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

### Migration from localStorage

The application maintains backward compatibility with the previous localStorage API through a wrapper in `src/lib/storage.js`. This wrapper:

1. Provides the same API interface as the previous localStorage implementation
2. Translates API calls to Prisma database operations
3. Handles conversion between JSON and structured data

The existing code can continue to use the same storage API without changes:

```javascript
// Example of using the storage API (same as before)
const userPrompts = await storage.get('userPrompts');
await storage.set({ 'userSettings': { theme: 'dark' } });
```

### Data Import/Export

The application supports importing and exporting data as JSON files:

1. **Export**: Retrieves data from the database and creates a JSON file
2. **Import**: Reads a JSON file and inserts the data into the database

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

## Future Considerations

- Database backups
- More advanced migration strategies for schema changes
- Potential cloud database support
- Performance optimizations for larger datasets