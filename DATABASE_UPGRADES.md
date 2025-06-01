# Database Upgrade System

This document explains the comprehensive database upgrade system for RoboPrep, including the challenges with Prisma client synchronization and the solutions implemented.

## The Challenge

When database schema changes (like adding the `isApproved` column), a "chicken-and-egg" problem occurs:

1. **Database gets upgraded** → New column is added to the User table
2. **Prisma client is outdated** → Generated from old schema, doesn't know about new column  
3. **API calls fail** → Any query using the new column fails with "Unknown field" error
4. **Application breaks** → Admin dashboard and other features become unusable

## Available Upgrade Methods

### 1. CLI-Only Database Upgrade (Safest)

**Command**: `npm run db:upgrade`  
**File**: `scripts/upgrade-db-standalone.js`

✅ **Advantages**:
- Uses raw SQL, no Prisma client dependency issues
- Works even when application is broken
- Creates automatic backups
- Clear error messages and progress tracking

❌ **Limitations**:
- Requires manual Prisma regeneration after: `npx prisma generate`
- Requires manual application rebuild: `npm run build`
- Application remains broken until rebuild and restart

**Best for**: Emergency upgrades, development, troubleshooting

### 2. Full Production Upgrade (Recommended)

**Command**: `npm run db:upgrade-production`  
**File**: `scripts/production-upgrade.js`

✅ **Advantages**:
- Complete end-to-end upgrade process
- Automatic Prisma client regeneration
- Automatic application rebuild
- Comprehensive verification
- Production-ready with proper error handling

❌ **Limitations**:
- Takes longer (includes build process)
- Requires Node.js and build tools on production server

**Best for**: Production deployments, automated upgrades

### 3. Web-Based Upgrade (Limited)

**Interface**: Admin Dashboard → Database Management  
**File**: `src/app/api/admin/database/route.js`

✅ **Advantages**:
- User-friendly interface
- No command line access required
- Integrated with admin dashboard

❌ **Limitations**:
- **May break application** until manual restart
- Prisma regeneration may fail in web environment
- Requires manual application restart in most cases

**Best for**: Development, non-critical environments

## Upgrade Process Flow

### Development Environment

```bash
# Option 1: Quick database-only upgrade
npm run db:upgrade

# Then manually:
npx prisma generate
npm run build
# Restart dev server (Ctrl+C, npm run dev)
```

```bash
# Option 2: Complete automated upgrade
npm run db:upgrade-production
# Restart dev server (Ctrl+C, npm run dev)
```

### Production Environment

```bash
# Recommended approach
npm run db:upgrade-production

# Then restart your application server:
pm2 restart roboprep
# OR
sudo systemctl restart roboprep
# OR
# Stop current process and: npm start
```

## Manual Production Upgrade Steps

If the automated script fails, follow these manual steps:

### 1. Database Upgrade
```bash
cd /path/to/roboprep/webpage
npm run db:upgrade  # or node scripts/upgrade-db-standalone.js
```

### 2. Prisma Client Regeneration
```bash
npx prisma generate
```

### 3. Application Rebuild
```bash
npm run build
```

### 4. Restart Application
```bash
# PM2
pm2 restart roboprep

# Systemd
sudo systemctl restart roboprep

# Manual
# Stop the current process and restart with:
npm start
```

### 5. Verification
- Access `/admin` dashboard
- Verify users load without "Unknown field isApproved" errors
- Test user approval workflow
- Check database version in admin dashboard

## Understanding the Error

The common error you'll see during upgrade issues:

```
PrismaClientValidationError: Unknown field `isApproved` for select statement on model `User`
```

This happens because:
1. The database has the `isApproved` column (upgrade succeeded)
2. The Prisma client was generated before the upgrade (client is outdated)
3. API routes try to select `isApproved` field (Prisma rejects it)

## Prevention for Future Schema Changes

### 1. Always Use Raw SQL During Upgrades

Our upgrade functions use raw SQL to avoid Prisma client dependency:

```javascript
// Instead of this (breaks during upgrade):
const users = await prisma.user.findMany({
  select: { isApproved: true }
});

// Use this during upgrades:
const result = await prisma.$queryRaw`
  SELECT isApproved FROM User WHERE id = ${userId}
`;
```

### 2. Complete Upgrade Scripts

Always include all steps in upgrade scripts:
1. Database schema changes
2. Prisma client regeneration  
3. Application rebuild
4. Verification

### 3. Backup Strategy

All upgrade methods create automatic backups:
- Format: `roboprep-backup-v{from}-to-v{to}-{timestamp}.db`
- Location: Parent directory of the project
- Automatic cleanup not implemented (manual cleanup required)

## Troubleshooting

### Web Upgrade Completed But Application Still Broken

**Problem**: Database upgraded successfully but API still fails with "Unknown field" errors.

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Rebuild application
npm run build

# Restart application server
pm2 restart roboprep  # or your restart method
```

### "Database is already at target version" But Errors Persist

**Problem**: Database version is correct but Prisma client is still outdated.

**Solution**:
```bash
# Force regeneration and rebuild
npx prisma generate
npm run build
# Restart server
```

### Production Upgrade Script Fails

**Problem**: `npm run db:upgrade-production` fails during build or Prisma generation.

**Solution**:
```bash
# Fall back to manual approach
npm run db:upgrade  # Database only
npx prisma generate  # If this fails, check for syntax errors
npm run build       # If this fails, check build output
# Restart server
```

### Admin Dashboard Shows "Error getting users"

**Problem**: Most common issue - Prisma client doesn't know about new fields.

**Solution**:
```bash
# Check database version first
npm run db:check

# If version is correct, regenerate client
npx prisma generate
npm run build
# Restart server
```

## Migration History

- **1.0.0**: Initial version with localStorage-only storage
- **2.0.0**: Added multi-user support with database
- **2.1.0**: Added user approval workflow (`isApproved` column)

## Environment Variables

```bash
# Required for upgrades
DATABASE_TARGET_VERSION="2.1.0"
DATABASE_URL="file:../roboprep.db"

# Optional for initial setup
DATABASE_INIT_VERSION="2.0.0"
```

## Best Practices

1. **Always backup before upgrades** (automatic in our scripts)
2. **Use CLI tools for production** rather than web interface
3. **Test upgrades in development first**
4. **Monitor logs during upgrade process**
5. **Verify admin dashboard after upgrades**
6. **Plan for application downtime during upgrades**

## Future Improvements

- Implement zero-downtime upgrades
- Add automatic rollback on failure
- Improve web-based upgrade reliability
- Add upgrade notification system
- Implement automated backup cleanup
- Add database migration testing framework

---

For immediate help with upgrade issues, use the CLI tools which provide detailed error messages and step-by-step guidance.