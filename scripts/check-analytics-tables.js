const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('Checking analytics tables...')
    
    // Check RecipeView
    try {
      const viewCount = await prisma.recipeView.count()
      console.log(`✅ RecipeView table exists with ${viewCount} records`)
    } catch (error) {
      console.log('❌ RecipeView table missing:', error.message)
    }
    
    // Check RecipeInteraction  
    try {
      const interactionCount = await prisma.recipeInteraction.count()
      console.log(`✅ RecipeInteraction table exists with ${interactionCount} records`)
    } catch (error) {
      console.log('❌ RecipeInteraction table missing:', error.message)
    }
    
    // Check RecipeRevenue
    try {
      const revenueCount = await prisma.recipeRevenue.count()
      console.log(`✅ RecipeRevenue table exists with ${revenueCount} records`)
    } catch (error) {
      console.log('❌ RecipeRevenue table missing:', error.message)
    }
    
    // Check VisitorSession
    try {
      const sessionCount = await prisma.visitorSession.count()
      console.log(`✅ VisitorSession table exists with ${sessionCount} records`)
    } catch (error) {
      console.log('❌ VisitorSession table missing:', error.message)
    }
    
  } catch (error) {
    console.error('Error checking tables:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()