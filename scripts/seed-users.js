const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Seeding users...')

  // Create test users
  const users = [
    {
      email: 'admin@pastry.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date()
    },
    {
      email: 'editor@pastry.com',
      password: 'Editor123!',
      name: 'Editor User',
      role: 'EDITOR',
      emailVerified: new Date()
    },
    {
      email: 'viewer@pastry.com',
      password: 'Viewer123!',
      name: 'Viewer User',
      role: 'VIEWER',
      emailVerified: new Date()
    },
    {
      email: 'member@pastry.com',
      password: 'Member123!',
      name: 'Member User',
      role: 'MEMBER',
      emailVerified: new Date()
    }
  ]

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log(`👤 User ${userData.email} already exists`)
      continue
    }

    const hashedPassword = await hashPassword(userData.password)

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    })

    console.log(`✅ Created user: ${user.email} (${user.role})`)
  }

  console.log('🎉 User seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })