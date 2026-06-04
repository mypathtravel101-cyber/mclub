import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use absolute path to prisma/dev.db to avoid SQLite connection issues
// The environment may have a stale DATABASE_URL, so we override it here
const DB_URL = process.env.DATABASE_URL?.includes('prisma/dev.db')
  ? process.env.DATABASE_URL
  : `file://${path.join(process.cwd(), 'prisma', 'dev.db')}?connection_limit=1`

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: DB_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = db
