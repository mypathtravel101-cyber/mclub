import { createClient } from '@libsql/client';

const url = 'libsql://mclub-mypathtravel101-cyber.aws-ap-northeast-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODMxMzE3NzEsImlkIjoiMDE5ZjJhZWYtNTIwMS03ZjI5LTlkNmQtYWY5ZDQyOTk5OWExIiwia2lkIjoiV2JCOFZYVWlZQm1UVFU0UTMwdXZSczRITW8xamlHWlExdWNUOXAyLTE4RSIsInJpZCI6IjdjNWVmNzFkLTgxODktNGY5ZC1hZDFmLTgxNWFkNThjMTg1NiJ9.qDOQ1BzvTB0VULEpU3_rtiYKn54PSDdPtx2jBjSOAm6ycPZqupW6IwMkS5TqXwUxKGwkzRXoseN2GWwPAOwkCQ';

const client = createClient({ url, authToken });

async function main() {
  // Test connection
  const result = await client.execute('SELECT 1 as test');
  console.log('Connected to Turso:', result.rows);

  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'director',
      "phone" TEXT,
      "avatar" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

    `CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "nameEn" TEXT NOT NULL,
      "emoji" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "descriptionEn" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "priceMin" REAL NOT NULL,
      "priceMax" REAL NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'HKD',
      "commissionRate" REAL NOT NULL DEFAULT 0,
      "commissionFixed" REAL NOT NULL DEFAULT 0,
      "commissionNegotiable" BOOLEAN NOT NULL DEFAULT 0,
      "parentId" TEXT,
      "attachmentUrl" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("parentId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS "Customer" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "phone" TEXT,
      "company" TEXT,
      "nationality" TEXT,
      "referrerId" TEXT,
      "notes" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "customerId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "agentId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "amount" REAL NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'HKD',
      "commission" REAL NOT NULL DEFAULT 0,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS "Commission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "agentId" TEXT NOT NULL,
      "orderId" TEXT,
      "amount" REAL NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'HKD',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "paidAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS "Event" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "type" TEXT NOT NULL DEFAULT 'seminar',
      "date" DATETIME NOT NULL,
      "location" TEXT,
      "maxAttendees" INTEGER NOT NULL DEFAULT 50,
      "imageUrl" TEXT,
      "status" TEXT NOT NULL DEFAULT 'upcoming',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS "EventParticipant" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'registered',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "EventParticipant_eventId_userId_key" ON "EventParticipant"("eventId", "userId")`,

    `CREATE TABLE IF NOT EXISTS "EventRegistration" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "guests" INTEGER NOT NULL DEFAULT 0,
      "notes" TEXT,
      "status" TEXT NOT NULL DEFAULT 'registered',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_eventId_email_key" ON "EventRegistration"("eventId", "email")`,
    `CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status")`,

    `CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'info',
      "read" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS "Notice" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'announcement',
      "targetRoles" TEXT NOT NULL DEFAULT 'admin,director',
      "authorId" TEXT NOT NULL,
      "isPinned" BOOLEAN NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )`,
  ];

  for (const sql of statements) {
    try {
      await client.execute(sql);
      const name = sql.split('EXISTS')[1]?.split('(')[0]?.trim() || sql.substring(0, 60);
      console.log('OK:', name);
    } catch (err: unknown) {
      console.error('ERR:', (err as Error).message?.substring(0, 100));
    }
  }

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('\nTables in Turso:');
  tables.rows.forEach(r => console.log('  -', r.name));

  await client.close();
}

main().catch(console.error);