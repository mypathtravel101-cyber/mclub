/**
 * DB Persistence Module — Auto Backup & Restore
 *
 * Problem: On space-z.ai, a rebuild/deploy may wipe the SQLite database file
 * (especially when DATABASE_URL uses a relative path that resolves inside .next/standalone/).
 *
 * Solution:
 * 1. On server startup, if DATABASE_URL is relative, REWRITE it to absolute path
 *    at the project root (outside .next/standalone/). This is the ROOT FIX.
 * 2. If the DB at the absolute path is empty but a backup exists, restore from backup.
 * 3. After every write operation, create a backup at the persistent location.
 * 4. The backup location is always at {projectRoot}/db/backup/ which survives rebuilds.
 */

import { copyFile, mkdir, stat, readdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// ─── Path Resolution ─────────────────────────────────────────────────────────

/** Detect if we're running inside .next/standalone/ */
function isStandaloneMode(): boolean {
  const cwd = process.cwd();
  return cwd.includes('.next/standalone') || cwd.includes('.next\\standalone');
}

/**
 * Get the project root directory.
 * In standalone mode, CWD is .next/standalone/ → project root is 2 levels up.
 * In dev mode, CWD is the project root.
 */
function getProjectRoot(): string {
  const cwd = process.cwd();
  if (isStandaloneMode()) {
    return path.resolve(cwd, '..', '..');
  }
  return cwd;
}

/**
 * REWRITE DATABASE_URL to use an absolute path at the project root.
 * This is the CRITICAL fix — if DATABASE_URL is relative, Prisma stores the DB
 * inside .next/standalone/ which gets wiped on rebuild. We force it to use
 * a path at the project root which persists across rebuilds.
 *
 * This MUST be called BEFORE creating the PrismaClient.
 */
export function fixDatabaseUrl(): void {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db';
  const match = dbUrl.match(/^file:(.+)/);
  if (!match) return;

  const dbPath = match[1];

  // If it's a relative path, rewrite to absolute
  if (dbPath.startsWith('./') || dbPath.startsWith('../') || !dbPath.startsWith('/')) {
    const projectRoot = getProjectRoot();
    // Strip leading slash from "file:/path" style
    const cleanPath = dbPath.startsWith('/') ? dbPath : dbPath;
    const absolutePath = path.resolve(projectRoot, cleanPath);

    // Also handle "file:/absolute" format (without leading ./)
    let finalPath: string;
    if (dbPath.startsWith('/')) {
      // Already absolute but might be wrong path (e.g., /app/data/ in Docker)
      // Keep it as-is if it starts with / — it's intentional
      finalPath = dbPath;
    } else {
      finalPath = absolutePath;
    }

    const newUrl = `file:${finalPath}`;
    process.env.DATABASE_URL = newUrl;
    console.log(`[DB Persistence] Rewrote DATABASE_URL: ${dbUrl} → ${newUrl}`);
  } else {
    console.log(`[DB Persistence] DATABASE_URL is absolute, keeping: ${dbUrl}`);
  }
}

/** Get the absolute path of the SQLite DB file from (fixed) DATABASE_URL */
function getDbFilePath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db';
  const match = dbUrl.match(/^file:(.+)/);
  if (!match) throw new Error(`Invalid DATABASE_URL: ${dbUrl}`);
  let dbPath = match[1];
  if (!dbPath.startsWith('/')) {
    dbPath = '/' + dbPath;
  }
  return dbPath;
}

/** Get the persistent backup directory (always at project root) */
function getBackupDir(): string {
  return path.join(getProjectRoot(), 'db', 'backup');
}

// ─── Core Functions ──────────────────────────────────────────────────────────

let restoreChecked = false;

/**
 * Check if a DB file has real user data (not just empty schema).
 * We check the file size — a DB with seed data (admin user + products) is > 20KB.
 * A freshly created SQLite DB is typically < 4KB.
 */
async function dbHasData(dbPath: string): Promise<boolean> {
  try {
    if (!existsSync(dbPath)) return false;
    const fileStat = await stat(dbPath);
    // Use file size as a quick heuristic — seeded DB is > 20KB
    // An empty schema-only DB is < 4KB
    if (fileStat.size < 4096) return false;

    // Double-check by actually querying
    const { PrismaClient } = await import('@prisma/client');
    const testDb = new PrismaClient({
      datasources: { db: { url: `file:${dbPath}` } },
      log: [],
    });
    try {
      const count = await testDb.user.count();
      await testDb.$disconnect();
      return count > 0;
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
    console.log('[DB Persistence] No backup found at', backupFile);
    return false;
  }

  try {
    // Ensure the DB directory exists
    const dbDir = path.dirname(dbPath);
    await mkdir(dbDir, { recursive: true });

    // Remove the current (empty) DB if it exists
    if (existsSync(dbPath)) {
      await unlink(dbPath);
      // Also remove WAL and SHM files if they exist
      for (const ext of ['-wal', '-shm', '-journal']) {
        const f = dbPath + ext;
        if (existsSync(f)) await unlink(f).catch(() => {});
      }
    }

    // Copy backup to DB location
    await copyFile(backupFile, dbPath);
    const backupSize = (await stat(backupFile)).size;
    console.log(`[DB Persistence] ✅ Restored database (${(backupSize / 1024).toFixed(1)} KB): ${backupFile} → ${dbPath}`);
    return true;
  } catch (err) {
    console.error('[DB Persistence] ❌ Failed to restore from backup:', err);
    return false;
  }
}

/**
 * Create a backup of the current database to the persistent location.
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
 * Main entry point — call this before creating PrismaClient.
 * 1. Fixes DATABASE_URL if it's relative (the ROOT CAUSE of data loss)
 * 2. Checks if DB needs restoring from backup
 * 3. Creates a backup if DB has data (for safety)
 */
export async function ensureDatabase(): Promise<void> {
  if (restoreChecked) return;
  restoreChecked = true;

  // STEP 1: Fix DATABASE_URL — this is the most important step
  fixDatabaseUrl();

  const dbPath = getDbFilePath();
  const backupDir = getBackupDir();

  console.log(`[DB Persistence] Project root: ${getProjectRoot()}`);
  console.log(`[DB Persistence] Database path: ${dbPath}`);
  console.log(`[DB Persistence] Backup dir: ${backupDir}`);

  // STEP 2: Check if DB has data, restore if not
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