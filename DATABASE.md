# RoboPrep Database Architecture

This document provides comprehensive documentation for the database architecture, schema management, and upgrade system used in the RoboPrep web application.

## Technology Stack

- **Database**: SQLite (file-based)
- **ORM**: Prisma
- **API Layer**: Next.js API Routes
- **Client Integration**: Fetch API with error handling
- **Authentication**: JWT tokens with secure cookie storage
- **Migration System**: Custom upgrade framework with version tracking

## Database Schema

### Core Models

#### DatabaseInfo
Tracks the database version for migration and upgrade purposes.
```prisma
model DatabaseInfo {
  id        Int      @id @default(autoincrement())
  version   String
  updatedAt DateTime @updatedAt
}
```

#### User
Stores user accounts for authentication and user-specific data.
```prisma
model User {
  id           String             @id @default(cuid())
  email        String             @unique
  password     String             // Hashed with bcrypt (12 rounds)
  firstName    String?
  lastName     String?
  isAdmin      Boolean            @default(false)
  isApproved   Boolean            @default(false)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  sessions     Session[]
  favorites    UserFavorite[]
  recentlyUsed UserRecentlyUsed[]
  settings     UserSetting[]
  responses    Response[]
}
```

#### Session
Manages user authentication sessions with JWT tokens.
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### UserSetting
Stores user-specific application settings and preferences.
```prisma
model UserSetting {
  id     String @id @default(cuid())
  userId String
  key    String
  value  String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
}
```

#### Prompt
Stores both core (built-in) and user-created prompts.
```prisma
model Prompt {
  id               String             @id
  title            String
  description      String?
  categoryId       String?
  promptText       String
  isUserCreated    Boolean
  usageCount       Int                @default(0)
  createdAt        DateTime
  lastUsed         DateTime?
  lastEdited       DateTime?
  tags             PromptTag[]
  responses        Response[]
  userFavorites    UserFavorite[]
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
Stores tags associated with prompts for filtering and organization.
```prisma
model Tag {
  id      String      @id @default(cuid())
  name    String      @unique
  prompts PromptTag[]
}
```

#### PromptTag
Junction table for the many-to-many relationship between prompts and tags.
```prisma
model PromptTag {
  promptId String
  tagId    String
  tag      Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  prompt   Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)

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
  prompt   Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, promptId])
}
```

#### UserRecentlyUsed
Tracks user-specific recently used prompts with timestamps.
```prisma
model UserRecentlyUsed {
  id       String   @id @default(cuid())
  userId   String
  promptId String
  usedAt   DateTime @default(now())
  prompt   Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, promptId])
  @@index([usedAt])
}
```

#### Response
Stores AI-generated responses to prompts with user attribution.
```prisma
model Response {
  id               String    @id
  promptId         String
  userId           String?
  responseText     String
  modelUsed        String?
  promptTokens     Int?
  completionTokens Int?
  totalTokens      Int?
  createdAt        DateTime
  lastEdited       DateTime?
  variablesUsed    String?   // JSON string for variable values
  prompt           Prompt    @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user             User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

#### Legacy Models
These models are maintained for backward compatibility:

```prisma
// Global Settings (legacy, maintained for backward compatibility)
model Setting {
  key   String @id
  value String // JSON string for setting values
}
```

> **Note**: The `Favorite` and `RecentlyUsed` tables have been removed as they've been completely replaced by the user-specific `UserFavorite` and `UserRecentlyUsed` tables.

## Database Version Management & Upgrade System

### Overview

The RoboPrep database includes a comprehensive upgrade system designed to handle schema changes while preserving all existing data. This system supports incremental versioning and provides both CLI and web-based upgrade interfaces.

### Version Tracking

The database version is tracked in the `DatabaseInfo` table:
- **Current supported versions**: 2.0.0 → 2.1.0 → (future versions)
- **Version storage**: Centralized in `DatabaseInfo.version` field
- **Automatic detection**: System automatically detects current vs. target version

### Environment Configuration

Database versioning is controlled through environment variables:

```bash
# Database version settings
DATABASE_INIT_VERSION="2.0.0"        # Version for new installations
DATABASE_TARGET_VERSION="2.1.0"      # Target version for upgrades
DATABASE_URL="file:../roboprep.db"   # Database file location
```

### Upgrade System Architecture

#### Reusable Framework

The upgrade system is designed to be extensible for future schema changes:

```javascript
// Current upgrade path: 2.0.0 → 2.1.0
async function upgrade_2_0_0_to_2_1_0() {
  // Adds isApproved column to User table
  // Auto-approves existing users
}

// Future upgrade paths (examples):
async function upgrade_2_1_0_to_2_2_0() {
  // Your next schema change
}

async function upgrade_2_2_0_to_3_0_0() {
  // Major version upgrade
}
```

#### Incremental Upgrade Support

The system supports chained upgrades:
- **Direct upgrades**: 2.0.0 → 2.1.0
- **Chained upgrades**: 2.0.0 → 2.1.0 → 2.2.0 (future)
- **Automatic path detection**: System determines required upgrade sequence

### Upgrade Tools

#### 1. CLI Upgrade Tool

**Location**: `scripts/upgrade-db-standalone.js`

**Usage**:
```bash
# Check if upgrade is needed
npm run db:check

# Perform upgrade if needed
npm run db:upgrade

# Force upgrade regardless of current status
node scripts/upgrade-db-standalone.js --force

# Show help
node scripts/upgrade-db-standalone.js --help
```

**Features**:
- ✅ **Standalone operation**: Works independently of Next.js application
- ✅ **Automatic backups**: Creates database backup before upgrade
- ✅ **Data preservation**: All existing data maintained during upgrade
- ✅ **Version verification**: Confirms successful upgrade completion
- ✅ **Detailed logging**: Comprehensive status and error reporting
- ✅ **Safety checks**: Original database unchanged on failure

#### 2. Web Admin Interface

**Access**: `/admin` page → Database Management section

**Features**:
- Real-time database status checking
- Visual upgrade interface with progress indicators
- Environment and version information display
- Database statistics overview
- Secure admin-only access

**API Endpoint**: `/api/admin/database`
- **GET**: Retrieve database status and version information
- **POST**: Trigger manual database upgrade

#### 3. Database API Functions

Core functions available in `src/lib/db.js`:

```javascript
// Version management
getDatabaseVersion()           // Get current database version
checkUpgradeNeeded()          // Check if upgrade is available
upgradeDatabase(from, to)     // Perform database upgrade

// Database statistics
getDbStats()                  // Get database record counts
```

### Upgrade Process

#### Current Upgrade: 2.0.0 → 2.1.0

**Purpose**: Add user approval workflow

**Changes**:
1. **Schema modification**: Add `isApproved` column to User table
   ```sql
   ALTER TABLE User ADD COLUMN isApproved BOOLEAN DEFAULT 0;
   ```

2. **Data migration**: Auto-approve existing users
   ```javascript
   await prisma.user.updateMany({
     where: { isApproved: false },
     data: { isApproved: true }
   });
   ```

3. **Version update**: Update database version to 2.1.0

#### Safety Features

- **Automatic backups**: Database copied before any changes
- **Rollback safety**: Original database preserved on failure
- **Column existence checking**: Prevents duplicate schema changes
- **Transaction safety**: Changes are applied atomically
- **Verification**: Post-upgrade validation confirms success

### Adding Future Schema Changes

#### Step 1: Update Environment Variables
```bash
# In .env.local
DATABASE_TARGET_VERSION="2.2.0"
```

#### Step 2: Create Upgrade Function
```javascript
// In scripts/upgrade-db-standalone.js
async function upgrade_2_1_0_to_2_2_0() {
  try {
    console.log('Executing upgrade 2.1.0 → 2.2.0: Your feature description');
    
    // Example: Add new table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS UserProfiles (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        bio TEXT,
        avatar TEXT,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )`;
    
    // Example: Add new column
    await prisma.$executeRaw`ALTER TABLE User ADD COLUMN phoneNumber TEXT`;
    
    // Example: Migrate existing data
    const users = await prisma.user.findMany();
    for (const user of users) {
      await prisma.userProfile.create({
        data: { userId: user.id, bio: 'Default bio' }
      });
    }
    
    console.log('Upgrade 2.1.0 → 2.2.0 completed successfully');
    return true;
  } catch (error) {
    console.error('Upgrade 2.1.0 → 2.2.0 failed:', error);
    return false;
  }
}
```

#### Step 3: Update Upgrade Logic
```javascript
// Add to upgradeDatabase() function
if (fromVersion === '2.1.0' && toVersion === '2.2.0') {
  if (!await upgrade_2_1_0_to_2_2_0()) {
    throw new Error('Upgrade 2.1.0 → 2.2.0 failed');
  }
}
```

#### Step 4: Update Prisma Schema
```prisma
// Add new models/fields to schema.prisma
model User {
  // ... existing fields
  phoneNumber String?
  profile     UserProfile?
}

model UserProfile {
  id     String @id @default(cuid())
  userId String @unique
  bio    String?
  avatar String?
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Production Deployment

#### Database Upgrade Workflow

1. **Backup production database**:
   ```bash
   cp roboprep.db roboprep-backup-$(date +%Y%m%d).db
   ```

2. **Check upgrade status**:
   ```bash
   npm run db:check
   ```

3. **Perform upgrade**:
   ```bash
   npm run db:upgrade
   ```

4. **Verify upgrade**:
   ```bash
   npm run db:check  # Should show "Up to Date"
   ```

#### Rollback Strategy

If upgrade fails:
1. **Automatic backup**: System creates backup before upgrade
2. **Preserved original**: Original database unchanged on failure
3. **Manual rollback**: Replace database file with backup if needed

### Database Operations

#### Initialization

```javascript
// Initialize new database
await initializeDatabase();

// Creates:
// - DatabaseInfo record with version
// - Default admin user (admin@example.com / RoboPrepMe)
// - Core categories and prompts
```

#### Authentication Implementation

The database supports comprehensive user authentication:

1. **User Account Management**:
   - Secure registration with email validation
   - Password encryption using bcrypt (12 rounds)
   - Login/logout with session management
   - User approval workflow (new users require admin approval)
   - Admin-controlled user management

2. **Session Management**:
   - JWT-based authentication tokens
   - Secure HTTP-only cookies
   - 12-hour session expiration
   - Session cleanup on logout

3. **Authorization**:
   - Role-based access (admin vs. regular user)
   - Protected API routes with authentication middleware
   - Admin panel for user management (`/admin`)

#### Multi-User Data Isolation

The schema supports proper multi-user data separation:

1. **User-Specific Data**:
   - Favorites (UserFavorite)
   - Recently used prompts (UserRecentlyUsed)
   - Settings (UserSetting)
   - AI responses (Response) with user attribution

2. **Shared Data**:
   - Prompts accessible to all users
   - Categories and tags are global
   - AI responses visible to all but attributed to creator

### API Layer Architecture

#### Database API Endpoint

Central API route at `/api/db` handles all database operations:

```javascript
// API request structure
{
  "operation": "getSetting|savePrompt|etc",
  "params": { /* operation-specific parameters */ }
}

// Supported operations:
// - getSetting, getSettings, setSetting
// - getPrompts, savePrompt, deletePrompt
// - getFavorites, addFavorite, removeFavorite
// - getRecentlyUsed, addRecentlyUsed
// - getResponses, saveResponse, deleteResponse
// - getCategories, getTags
```

#### Authentication API Endpoints

```
/api/auth/
├─ register/        # User registration with validation
├─ login/          # User login with session creation
├─ logout/         # Session termination
├─ me/             # Current user information
└─ change-password/ # Password update for authenticated users

/api/admin/
├─ users/          # User management (list, create)
├─ users/[id]/     # Individual user operations
│  ├─ route.js     # Update/delete user
│  ├─ approve/     # Approve pending user
│  ├─ reset-password/ # Admin password reset
│  └─ toggle-admin/   # Toggle admin status
└─ database/       # Database management and upgrades
```

#### Client-Side Storage API

The storage API (`src/lib/storage.js`) maintains compatibility with previous localStorage implementation:

```javascript
const storage = {
  get: async (keys) => {
    // Fetch from database via API
  },
  
  set: async (items) => {
    // Save to database via API
  },
  
  remove: async (keys) => {
    // Remove from database via API
  },
  
  // Specialized methods
  getResponses: async () => { /* ... */ },
  saveResponse: async (response) => { /* ... */ },
  // ...
};
```

### Performance Considerations

#### Database Optimization

- **Indexed fields**: `usedAt` in UserRecentlyUsed for efficient recent queries
- **Unique constraints**: Prevent duplicate favorites and recently used entries
- **Foreign key constraints**: Ensure data integrity with cascading deletes
- **Connection pooling**: Configurable via `DATABASE_POOL_SIZE`

#### Query Optimization

- **Relation loading**: Prisma `include` for efficient data fetching
- **Selective fields**: Only fetch required data in user management
- **Batch operations**: Efficient tag and category management

### Error Handling

#### Multi-Level Error Handling

1. **Database Level**: Prisma error handling with proper error types
2. **API Level**: HTTP status codes and error messages
3. **Client Level**: User-friendly error messages and fallbacks
4. **Authentication Level**: Specialized handling for auth failures

```javascript
// Example error handling in API routes
try {
  const result = await prisma.user.create(userData);
  return NextResponse.json(result);
} catch (error) {
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'User already exists' },
      { status: 409 }
    );
  }
  return NextResponse.json(
    { error: 'Database error' },
    { status: 500 }
  );
}
```

### Environment Configuration

#### Required Environment Variables

```bash
# Database settings
DATABASE_URL="file:../roboprep.db"
DATABASE_POOL_SIZE=5
DATABASE_INIT_VERSION="2.0.0"
DATABASE_TARGET_VERSION="2.1.0"

# Authentication settings
JWT_SECRET="your-secure-random-secret"
JWT_EXPIRATION="12h"
COOKIE_NAME="robo_auth"
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
```

#### Development vs. Production

- **Development**: Uses file-based SQLite with relative paths
- **Production**: Configurable database location and security settings
- **Upgrade system**: Works in both environments with appropriate safeguards

### Monitoring & Maintenance

#### Database Statistics

Available through admin interface and API:
- User count (total, approved, pending)
- Prompt count (total, user-created, core)
- Response count with token usage
- Category and tag counts
- Session and setting counts

#### Regular Maintenance

- **Session cleanup**: Expired sessions automatically handled
- **Database backups**: Automatic backup before upgrades
- **Version monitoring**: Admin interface shows current vs. target version
- **Error logging**: Comprehensive logging for troubleshooting

### Future Enhancements

#### Planned Database Features

- **Performance optimizations**: Query optimization and caching strategies
- **Advanced user management**: Role-based permissions beyond admin/user
- **Database analytics**: Usage patterns and performance metrics
- **Backup automation**: Scheduled database backups
- **Cloud database support**: Migration path to hosted databases

#### Upgrade System Enhancements

- **Automated testing**: Unit tests for upgrade functions
- **Migration rollback**: Automated rollback capabilities
- **Preview mode**: Test upgrades without making changes
- **Batch upgrades**: Support for skipping intermediate versions
- **Progress tracking**: Real-time upgrade progress in web interface

This comprehensive database system provides a solid foundation for the RoboPrep application with built-in scalability, security, and maintainability features.