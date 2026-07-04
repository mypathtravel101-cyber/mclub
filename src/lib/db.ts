import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Database connection strategy:
 * - libsql:// → Turso cloud DB (persistent, no data loss on redeploy)
 * - file:   → Local SQLite (dev only, with backup/restore)
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (databaseUrl.startsWith('libsql:')) {
    // ─── Turso Cloud Database ────────────────────────────────────────
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    })
    const adapter = new PrismaLibSql(libsql)
    console.log('[DB] Using Turso cloud database')
    return new PrismaClient({ adapter })
  }

  // ─── Local SQLite with persistence ────────────────────────────────
  try {
    const { fixDatabaseUrl, ensureDatabase } = require('./db-persistence')
    fixDatabaseUrl()
    ensureDatabase().catch((err: unknown) => {
      console.error('[DB] ensureDatabase failed:', err)
    })
  } catch {
    // db-persistence not available
  }

  return new PrismaClient()
}

const prismaClient = createPrismaClient()

// ─── Auto-backup proxy for local SQLite only ──────────────────────────
let backupTimer: ReturnType<typeof setTimeout> | null = null;
let backupPending = false;

function scheduleBackup() {
  const databaseUrl = process.env.DATABASE_URL || ''
  if (databaseUrl.startsWith('libsql:')) return

  if (!backupPending) {
    backupPending = true;
    backupTimer = setTimeout(() => {
      backupPending = false;
      try {
        const { backupDatabase } = require('./db-persistence')
        backupDatabase().catch((err: unknown) => {
          console.error('[Auto-Backup] Failed:', err);
        });
      } catch { /* ignore */ }
    }, 5000);
  }
}

const WRITE_METHODS = new Set([
  'create', 'createMany', 'update', 'updateMany',
  'delete', 'deleteMany', 'upsert',
]);

const originalModels = prismaClient as unknown as Record<string, Record<string, unknown>>
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

export const db = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db