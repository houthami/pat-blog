const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking existing users...')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      password: true
    }
  })

  console.log(`Found ${users.length} users:`)
  users.forEach(user => {
    console.log(`- ${user.email}: ${user.role} (password: ${user.password ? 'set' : 'missing'})`)
  })

  // Test password verification
  if (users.length > 0) {
    const bcrypt = require('bcryptjs')
    const testUser = users.find(u => u.email === 'admin@pastry.com')
    if (testUser && testUser.password) {
      const isValid = await bcrypt.compare('Admin123!', testUser.password)
      console.log(`✅ Password verification test: ${isValid ? 'PASS' : 'FAIL'}`)
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Verification failed:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })