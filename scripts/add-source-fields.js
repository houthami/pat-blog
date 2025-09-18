const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSourceFields() {
  try {
    console.log('Adding source fields to recipes table...')

    // Check if we're using PostgreSQL or SQLite
    const dbUrl = process.env.DATABASE_URL || ''
    const isPostgres = dbUrl.includes('postgresql')

    if (isPostgres) {
      // PostgreSQL queries
      await prisma.$executeRaw`
        ALTER TABLE recipes
        ADD COLUMN IF NOT EXISTS source VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "sourceUrl" VARCHAR(500),
        ADD COLUMN IF NOT EXISTS "sourceNote" TEXT;
      `
    } else {
      // SQLite queries (for development)
      try {
        await prisma.$executeRaw`ALTER TABLE recipes ADD COLUMN source TEXT;`
      } catch (error) {
        if (!error.message.includes('duplicate column')) {
          throw error
        }
      }

      try {
        await prisma.$executeRaw`ALTER TABLE recipes ADD COLUMN sourceUrl TEXT;`
      } catch (error) {
        if (!error.message.includes('duplicate column')) {
          throw error
        }
      }

      try {
        await prisma.$executeRaw`ALTER TABLE recipes ADD COLUMN sourceNote TEXT;`
      } catch (error) {
        if (!error.message.includes('duplicate column')) {
          throw error
        }
      }
    }

    console.log('✅ Source fields added successfully!')

    // Set default source for existing recipes
    const updateResult = await prisma.recipe.updateMany({
      where: {
        source: null
      },
      data: {
        source: 'original'
      }
    })

    console.log(`✅ Updated ${updateResult.count} existing recipes with default source`)

  } catch (error) {
    console.error('❌ Error adding source fields:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSourceFields()