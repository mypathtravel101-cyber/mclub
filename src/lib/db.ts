import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Database connection — PostgreSQL (Neon / any Postgres)
 *
 * DATABASE_URL format: postgresql://user:password@host/database?sslmode=require
 * No adapter needed — Prisma has native PostgreSQL support.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    console.log('[DB] Using PostgreSQL (Neon)')
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  }

  // Fallback: local SQLite (dev only)
  console.log('[DB] Using local SQLite (dev mode)')
  return new PrismaClient()
}

const prismaClient = createPrismaClient()

export const db = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db