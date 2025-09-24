const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function publishAllRecipes() {
  try {
    console.log('📢 Publishing all recipes...')

    const result = await prisma.recipe.updateMany({
      where: {
        status: 'DRAFT'
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })

    console.log(`✅ Successfully published ${result.count} recipes`)

    // Show summary
    const summary = await prisma.recipe.groupBy({
      by: ['status'],
      _count: true
    })

    console.log('\n📊 Recipe status summary:')
    summary.forEach(item => {
      console.log(`   - ${item.status}: ${item._count} recipes`)
    })

  } catch (error) {
    console.error('❌ Error publishing recipes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

publishAllRecipes()