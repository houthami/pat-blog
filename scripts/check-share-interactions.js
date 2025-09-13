const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkShareInteractions() {
  try {
    console.log('🔍 Checking for share interactions...')
    
    const shareInteractions = await prisma.recipeInteraction.findMany({
      where: { type: 'share' },
      orderBy: { createdAt: 'desc' },
      include: {
        recipe: { select: { title: true } }
      },
      take: 10
    })
    
    console.log(`📊 Found ${shareInteractions.length} share interactions:`)
    
    shareInteractions.forEach((interaction, i) => {
      console.log(`  ${i+1}. ${interaction.createdAt.toISOString()} - "${interaction.recipe.title}" - ${interaction.value}`)
    })
    
    if (shareInteractions.length === 0) {
      console.log('❌ No share interactions found. Try clicking the share button on a recipe page!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkShareInteractions()