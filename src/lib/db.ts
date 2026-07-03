import { PrismaClient } from '@prisma/client'
import { ensureDatabase, backupDatabase, fixDatabaseUrl } from './db-persistence'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── CRITICAL: Fix DATABASE_URL BEFORE anything else ─────────────────────────
// If DATABASE_URL is relative (e.g. file:./db/custom.db), Prisma stores the DB
// inside .next/standalone/ which gets wiped on rebuild.
// fixDatabaseUrl() rewrites it to an absolute path at the project root.
fixDatabaseUrl();

// ─── Ensure database is restored from backup on first import ─────────────────
let initPromise: Promise<void> | null = null;

async function initDb() {
  if (!initPromise) {
    initPromise = ensureDatabase();
  }
  await initPromise;
}

// Start restore check immediately on module load (don't await — runs in background)
initDb();

// ─── Create Prisma client ────────────────────────────────────────────────────
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
})

// ─── Prisma Middleware: Auto-backup after any write operation ────────────────
// Intercepts ALL create/update/delete and triggers a backup in the background.
// No need to modify individual route files.
let backupTimer: ReturnType<typeof setTimeout> | null = null;
let backupPending = false;

prismaClient.$use(async (params, next) => {
  const result = await next(params);

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