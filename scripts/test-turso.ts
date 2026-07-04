import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const url = 'libsql://mclub-mypathtravel101-cyber.aws-ap-northeast-1.turso.io'
const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODMxMzE3NzEsImlkIjoiMDE5ZjJhZWYtNTIwMS03ZjI5LTlkNmQtYWY5ZDQyOTk5OWExIiwia2lkIjoiV2JCOFZYVWlZQm1UVFU0UTMwdXZSczRITW8xamlHWlExdWNUOXAyLTE4RSIsInJpZCI6IjdjNWVmNzFkLTgxODktNGY5ZC1hZDFmLTgxNWFkNThjMTg1NiJ9.qDOQ1BzvTB0VULEpU3_rtiYKn54PSDdPtx2jBjSOAm6ycPZqupW6IwMkS5TqXwUxKGwkzRXoseN2GWwPAOwkCQ'

async function main() {
  const libsql = createClient({ url, authToken: token })
  const adapter = new PrismaLibSql(libsql)
  const db = new PrismaClient({ adapter })

  // Test 1: Read users
  const users = await db.user.findMany({ select: { id: true, email: true, role: true } })
  console.log(`Users (${users.length}):`, users.map(u => `${u.email} (${u.role})`).join(', '))

  // Test 2: Read products
  const products = await db.product.findMany({ select: { id: true, name: true } })
  console.log(`Products (${products.length}):`, products.map(p => p.name).join(', '))

  // Test 3: Write test
  const testUser = await db.user.findFirst({ where: { email: 'admin@mclub.com' } })
  if (testUser) {
    const notice = await db.notice.create({
      data: {
        title: 'Turso 連接測試',
        content: '如果你見到呢條公告，代表 Turso 雲端數據庫連接成功！數據已經永久保存。',
        category: 'announcement',
        targetRoles: 'admin,director',
        authorId: testUser.id,
      },
    })
    console.log(`Write test OK: Created notice "${notice.title}" (id: ${notice.id})`)

    // Cleanup
    await db.notice.delete({ where: { id: notice.id } })
    console.log('Cleanup OK: Notice deleted')
  }

  await db.$disconnect()
  console.log('\n✅ ALL TESTS PASSED — Turso + Prisma 7 adapter working perfectly!')
}

main().catch((err) => {
  console.error('❌ TEST FAILED:', err)
  process.exit(1)
})