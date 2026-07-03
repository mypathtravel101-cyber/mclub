import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Auto-detect database backend:
 * - If DATABASE_URL starts with "libsql:" → use Turso cloud DB (persistent)
 * - Otherwise → use local SQLite with backup/restore
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (databaseUrl.startsWith('libsql:')) {
    // ─── Turso Cloud Database ───────────────────────────────────────────
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    })
    const adapter = new PrismaLibSQL(libsql)
    console.log('[DB] Using Turso cloud database:', databaseUrl.replace(/@.*/, '@***'))
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    })
  }

  // ─── Local SQLite with persistence ───────────────────────────────────
  // Import persistence module for local SQLite backup/restore
  try {
    const { fixDatabaseUrl, ensureDatabase } = require('./db-persistence')
    fixDatabaseUrl()
    // Start restore check in background (non-blocking)
    ensureDatabase().catch((err: unknown) => {
      console.error('[DB] ensureDatabase failed:', err)
    })
  } catch {
    // db-persistence not available, continue without it
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

const prismaClient = createPrismaClient()

// ─── Auto-backup via Proxy for local SQLite only ──────────────────────
// Only wraps write methods for local SQLite (not Turso, which is already persistent)
let backupTimer: ReturnType<typeof setTimeout> | null = null;
let backupPending = false;

function scheduleBackup() {
  const databaseUrl = process.env.DATABASE_URL || ''
  if (databaseUrl.startsWith('libsql:')) return // No backup needed for Turso

  if (!backupPending) {
    backupPending = true;
    backupTimer = setTimeout(() => {
      backupPending = false;
      try {
        const { backupDatabase } = require('./db-persistence')
        backupDatabase().catch((err: unknown) => {
          console.error('[Auto-Backup] Background backup failed:', err);
        });
      } catch {
        // Ignore if persistence module not available
      }
    }, 5000);
  }
}

const WRITE_METHODS = new Set([
  'create', 'createMany', 'update', 'updateMany',
  'delete', 'deleteMany', 'upsert',
]);

const originalModels = prismaClient as unknown as Record<string, Record<string, unknown>>;
for (const modelName of Object.keys(prismaClient)) {
  const model = originalModels[modelName];
  if (!model || typeof model !== 'object') continue;

  for (const method of WRITE_METHODS) {
    const original = model[method];
    if (typeof original !== 'function') continue;

    model[method] = function (...args: unknown[]) {
      const result = (original as Function).apply(this, args);
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