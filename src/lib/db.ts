import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Database connection
 * - Production: Always connect to Neon PostgreSQL
 * - Development: Use local SQLite via .env DATABASE_URL
 */
const NEON_URL = 'postgresql://neondb_owner:npg_IgKsQi54qphJ@ep-holy-wind-aoj7xyto-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

function createPrismaClient(): PrismaClient {
  // Production: always use Neon PostgreSQL
  if (process.env.NODE_ENV === 'production') {
    console.log('[DB] Production mode — using Neon PostgreSQL')
    return new PrismaClient({
      datasources: {
        db: { url: NEON_URL },
      },
    })
  }

  // Development: use DATABASE_URL from .env (local SQLite)
  console.log('[DB] Dev mode — using local DATABASE_URL')
  return new PrismaClient()
}

const prismaClient = createPrismaClient()

export const db = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db