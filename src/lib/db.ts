import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In production, DATABASE_URL is set by start.sh (e.g. file:/app/db/custom.db)
// In development, use the .env file value
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = db
