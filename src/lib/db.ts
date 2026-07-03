import { PrismaClient } from '@prisma/client'
import { ensureDatabase, backupDatabase } from './db-persistence'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure database is restored from backup on first import (server startup)
let initPromise: Promise<void> | null = null;

async function initDb() {
  if (!initPromise) {
    initPromise = ensureDatabase();
  }
  await initPromise;
}

// Start restore check immediately on module load
initDb();

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
})

// ─── Prisma Middleware: Auto-backup after any write operation ────────────────
// This intercepts ALL create/update/delete operations and triggers a backup
// in the background. No need to modify individual route files.
let backupTimer: ReturnType<typeof setTimeout> | null = null;
let backupPending = false;

prismaClient.$use(async (params, next) => {
  const result = await next(params);

  // Detect write operations
  const action = params.action;
  if (['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'upsert'].includes(action)) {
    // Debounce: only backup once every 5 seconds even if multiple writes happen
    if (!backupPending) {
      backupPending = true;
      backupTimer = setTimeout(() => {
        backupPending = false;
        backupDatabase().catch((err) => {
          console.error('[Auto-Backup] Background backup failed:', err);
        });
      }, 5000);
    }
  }

  return result;
});

export const db = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Re-export backup function so API routes can call it after writes
export { backupDatabase } from './db-persistence'