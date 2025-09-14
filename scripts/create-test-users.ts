import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function createTestUsers() {
  console.log('Creating test users...')

  try {
    // Admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@pastry.com' },
      update: {},
      create: {
        email: 'admin@pastry.com',
        password: await hashPassword('Admin123!'),
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })
    console.log('✅ Created admin user:', adminUser.email)

    // Editor user
    const editorUser = await prisma.user.upsert({
      where: { email: 'editor@pastry.com' },
      update: {},
      create: {
        email: 'editor@pastry.com',
        password: await hashPassword('Editor123!'),
        name: 'Editor User',
        role: 'EDITOR',
        emailVerified: new Date(),
      },
    })
    console.log('✅ Created editor user:', editorUser.email)

    // Viewer user
    const viewerUser = await prisma.user.upsert({
      where: { email: 'viewer@pastry.com' },
      update: {},
      create: {
        email: 'viewer@pastry.com',
        password: await hashPassword('Viewer123!'),
        name: 'Viewer User',
        role: 'VIEWER',
        emailVerified: new Date(),
      },
    })
    console.log('✅ Created viewer user:', viewerUser.email)

    // Test user with weak password (for testing password validation)
    const testUser = await prisma.user.upsert({
      where: { email: 'test@pastry.com' },
      update: {},
      create: {
        email: 'test@pastry.com',
        password: await hashPassword('TestPassword123!'),
        name: 'Test User',
        role: 'VIEWER',
      },
    })
    console.log('✅ Created test user:', testUser.email)

    // Remove old visitor user if exists and recreate as viewer
    try {
      await prisma.user.delete({
        where: { email: 'visitor@pastry.com' }
      })
    } catch (error) {
      // User doesn't exist, that's fine
    }

    // Create new viewer user (was previously visitor)
    const newViewerUser = await prisma.user.create({
      data: {
        email: 'member@pastry.com',
        password: await hashPassword('Member123!'),
        name: 'Member User',
        role: 'VIEWER',
      },
    })
    console.log('✅ Created member user:', newViewerUser.email)

    console.log('\n🎉 Test users created successfully!')
    console.log('\nLogin credentials:')
    console.log('👑 Admin: admin@pastry.com / Admin123!')
    console.log('✏️  Editor: editor@pastry.com / Editor123!')
    console.log('👁️  Viewer: viewer@pastry.com / Viewer123!')
    console.log('🧪 Test: test@pastry.com / TestPassword123!')
    console.log('👤 Member: member@pastry.com / Member123!')

  } catch (error) {
    console.error('❌ Error creating test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()