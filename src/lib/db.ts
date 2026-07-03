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

// ─── Auto-backup via Proxy (works with Prisma v6+, which removed $use) ───────
// Wraps write methods (create/update/delete/upsert) to trigger background backup.
// Uses debouncing to avoid excessive backups during bulk operations.
let backupTimer: ReturnType<typeof setTimeout> | null = null;
let backupPending = false;

function scheduleBackup() {
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

const WRITE_METHODS = new Set([
  'create', 'createMany', 'update', 'updateMany',
  'delete', 'deleteMany', 'upsert',
]);

// Wrap each model's write methods with auto-backup
const originalModels = prismaClient as unknown as Record<string, Record<string, unknown>>;
for (const modelName of Object.keys(prismaClient)) {
  const model = originalModels[modelName];
  if (!model || typeof model !== 'object') continue;

  for (const method of WRITE_METHODS) {
    const original = model[method];
    if (typeof original !== 'function') continue;

    model[method] = function (...args: unknown[]) {
      const result = (original as Function).apply(this, args);
      // Handle both sync and async (Promise) results
      if (result && typeof result === 'object' && 'then' in result) {
        return (result as Promise<unknown>).then((val: unknown) => {
          scheduleBackup();
          return val;
        });
      }
      scheduleBackup();
      return result;
    };
  }
}

export const db = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;