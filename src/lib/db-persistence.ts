/**
 * DB Persistence Module — Auto Backup & Restore
 *
 * Problem: On space-z.ai, a rebuild/deploy may wipe the SQLite database file
 * (especially when DATABASE_URL uses a relative path that resolves inside .next/standalone/).
 *
 * Solution:
 * 1. On every server startup, if the current DB is empty (freshly created by Prisma)
 *    but a backup exists at a persistent location, restore from backup.
 * 2. After every write API call (via middleware), create a backup.
 * 3. The backup location is always at the project root /home/z/my-project/db/backup/
 *    which survives rebuilds because it's outside .next/.
 */

import { copyFile, mkdir, stat, readdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// ─── Paths ───────────────────────────────────────────────────────────────────

/** Get the absolute path of the SQLite DB file from DATABASE_URL */
function getDbFilePath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db';
  // DATABASE_URL format: "file:/absolute/path/to/db.sqlite" or "file:./relative/path.db"
  const match = dbUrl.match(/^file:(.+)/);
  if (!match) throw new Error(`Invalid DATABASE_URL: ${dbUrl}`);
  let dbPath = match[1];
  // If it starts with ./, resolve relative to project root
  if (dbPath.startsWith('./')) {
    const cwd = process.cwd();
    const projectRoot = cwd.endsWith('.next/standalone') || cwd.endsWith('.next\\standalone')
      ? path.resolve(cwd, '..', '..')
      : cwd;
    dbPath = path.resolve(projectRoot, dbPath);
  }
  // Remove leading slash if it's a Windows-style absolute path
  // e.g. "file:/app/data/custom.db" → "/app/data/custom.db"
  if (!dbPath.startsWith('/')) {
    dbPath = '/' + dbPath;
  }
  return dbPath;
}

/** Get the persistent backup directory (always at project root) */
function getBackupDir(): string {
  const cwd = process.cwd();
  const projectRoot = cwd.endsWith('.next/standalone') || cwd.endsWith('.next\\standalone')
    ? path.resolve(cwd, '..', '..')
    : cwd;
  return path.join(projectRoot, 'db', 'backup');
}

// ─── Core Functions ──────────────────────────────────────────────────────────

let restoreChecked = false;

/**
 * Check if a DB file has real user data (not just the empty schema).
 * We check if it has any rows in the User table (which is always seeded).
 */
async function dbHasData(dbPath: string): Promise<boolean> {
  try {
    if (!existsSync(dbPath)) return false;
    const fileStat = await stat(dbPath);
    // A freshly created SQLite DB is typically < 4KB
    // A DB with seed data should be much larger
    // But let's do a proper check via a quick SQL query
    const { PrismaClient } = await import('@prisma/client');
    const testDb = new PrismaClient({
      datasources: { db: { url: `file:${dbPath}` } },
      log: [],
    });
    try {
      const userCount = await testDb.user.count();
      await testDb.$disconnect();
      return userCount > 0;
    } catch {
      await testDb.$disconnect();
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Restore database from the latest backup.
 * Returns true if restore was successful.
 */
export async function restoreFromBackup(): Promise<boolean> {
  const dbPath = getDbFilePath();
  const backupDir = getBackupDir();
  const backupFile = path.join(backupDir, 'custom.db');

  if (!existsSync(backupFile)) {
    console.log('[DB Persistence] No backup found, skipping restore.');
    return false;
  }

  try {
    // Ensure the DB directory exists
    const dbDir = path.dirname(dbPath);
    await mkdir(dbDir, { recursive: true });

    // Remove the current (empty) DB if it exists
    if (existsSync(dbPath)) {
      await unlink(dbPath);
    }

    // Copy backup to DB location
    await copyFile(backupFile, dbPath);
    console.log(`[DB Persistence] ✅ Restored database from backup: ${backupFile} → ${dbPath}`);
    return true;
  } catch (err) {
    console.error('[DB Persistence] ❌ Failed to restore from backup:', err);
    return false;
  }
}

/**
 * Create a backup of the current database to the persistent location.
 * This is the function that should be called after data changes.
 */
export async function backupDatabase(): Promise<void> {
  const dbPath = getDbFilePath();
  const backupDir = getBackupDir();
  const backupFile = path.join(backupDir, 'custom.db');

  try {
    if (!existsSync(dbPath)) {
      console.log('[DB Persistence] No database file to backup.');
      return;
    }

    // Ensure backup directory exists
    await mkdir(backupDir, { recursive: true });

    // Also keep a timestamped backup (keep last 3)
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const tsBackup = path.join(backupDir, `custom_${ts}.db`);

    // Clean old timestamped backups (keep only the latest 3)
    try {
      const files = await readdir(backupDir);
      const tsFiles = files
        .filter(f => f.startsWith('custom_') && f.endsWith('.db'))
        .sort()
        .reverse();
      // Delete all but the newest 3
      for (const f of tsFiles.slice(3)) {
        await unlink(path.join(backupDir, f));
      }
    } catch {
      // Ignore cleanup errors
    }

    // Copy current DB to timestamped backup first
    await copyFile(dbPath, tsBackup);
    // Then copy to the "latest" backup
    await copyFile(dbPath, backupFile);

    const fileSize = (await stat(backupFile)).size;
    console.log(`[DB Persistence] ✅ Database backed up (${(fileSize / 1024).toFixed(1)} KB) → ${backupFile}`);
  } catch (err) {
    console.error('[DB Persistence] ❌ Failed to backup database:', err);
  }
}

/**
 * Main entry point — call this before any Prisma operation.
 * On first call, it checks if the DB needs restoring from backup.
 */
export async function ensureDatabase(): Promise<void> {
  if (restoreChecked) return;
  restoreChecked = true;

  const dbPath = getDbFilePath();

  console.log(`[DB Persistence] Database path: ${dbPath}`);
  console.log(`[DB Persistence] Backup dir: ${getBackupDir()}`);

  const hasData = await dbHasData(dbPath);
  if (hasData) {
    console.log('[DB Persistence] Database has data, no restore needed.');
    // Still do a backup on startup to keep it fresh
    await backupDatabase();
  } else {
    console.log('[DB Persistence] Database is empty or missing — attempting restore...');
    const restored = await restoreFromBackup();
    if (restored) {
      console.log('[DB Persistence] ✅ Restore complete! Your data is safe.');
    } else {
      console.log('[DB Persistence] ⚠️  No backup to restore. Fresh database will be seeded.');
    }
  }
}