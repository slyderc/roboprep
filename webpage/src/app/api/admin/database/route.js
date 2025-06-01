import { NextResponse } from 'next/server';
import { getDatabaseVersion, checkUpgradeNeeded, upgradeDatabase, getDbStats } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * GET - Get database status and version information
 */
export async function GET(request) {
  try {
    // Check if user is admin
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const currentVersion = await getDatabaseVersion();
    const upgradeInfo = await checkUpgradeNeeded();
    const stats = await getDbStats();

    return NextResponse.json({
      currentVersion,
      upgradeInfo,
      stats,
      environment: {
        targetVersion: process.env.DATABASE_TARGET_VERSION || '2.1.0',
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    console.error('Database status error:', error);
    return NextResponse.json(
      { error: 'Failed to get database status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Manually trigger database upgrade
 */
export async function POST(request) {
  try {
    // Check if user is admin
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'upgrade') {
      console.log('Manual database upgrade requested by admin:', user.email);
      
      const upgradeInfo = await checkUpgradeNeeded();
      
      if (!upgradeInfo.needsUpgrade) {
        return NextResponse.json({
          success: true,
          message: 'Database is already up to date',
          currentVersion: upgradeInfo.currentVersion,
          targetVersion: upgradeInfo.targetVersion
        });
      }

      const success = await upgradeDatabase(
        upgradeInfo.currentVersion,
        upgradeInfo.targetVersion
      );

      if (success) {
        // After successful database upgrade, regenerate Prisma client
        console.log('Database upgrade successful, regenerating Prisma client...');
        let prismaRegenerateSuccess = false;
        let prismaError = null;
        
        try {
          await execAsync('npx prisma generate', { cwd: process.cwd() });
          console.log('Prisma client regenerated successfully');
          prismaRegenerateSuccess = true;
        } catch (error) {
          console.error('Failed to regenerate Prisma client:', error);
          prismaError = error.message;
        }
        
        return NextResponse.json({
          success: true,
          message: `Database upgraded successfully from ${upgradeInfo.currentVersion} to ${upgradeInfo.targetVersion}`,
          fromVersion: upgradeInfo.currentVersion,
          toVersion: upgradeInfo.targetVersion,
          prismaRegenerated: prismaRegenerateSuccess,
          prismaError: prismaError,
          nextSteps: prismaRegenerateSuccess 
            ? ['Application restart recommended for full compatibility']
            : ['Manual Prisma regeneration required: npx prisma generate', 'Application rebuild required: npm run build', 'Application restart required']
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Database upgrade failed - check server logs for details'
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: upgrade' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Database upgrade error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database upgrade failed with error: ' + error.message
      },
      { status: 500 }
    );
  }
}