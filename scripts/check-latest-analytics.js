const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLatestData() {
  try {
    console.log('🔍 Checking latest analytics data...')
    
    // Get total counts
    const viewCount = await prisma.recipeView.count()
    const sessionCount = await prisma.visitorSession.count()
    const interactionCount = await prisma.recipeInteraction.count()
    
    console.log(`📊 Total views: ${viewCount}`)
    console.log(`👥 Total sessions: ${sessionCount}`)
    console.log(`🎯 Total interactions: ${interactionCount}`)
    
    // Get latest view
    const latestView = await prisma.recipeView.findFirst({
      orderBy: { viewedAt: 'desc' },
      include: { recipe: { select: { title: true } } }
    })
    
    if (latestView) {
      console.log('\n🆕 Latest view:')
      console.log(`  Recipe: ${latestView.recipe.title}`)
      console.log(`  Visitor: ${latestView.visitorId}`)
      console.log(`  Time: ${latestView.viewedAt}`)
      console.log(`  Duration: ${latestView.timeSpent}s`)
      console.log(`  Scroll: ${latestView.scrollDepth}%`)
      console.log(`  Country: ${latestView.country}`)
    }
    
    // Get latest session
    const latestSession = await prisma.visitorSession.findFirst({
      orderBy: { lastSeen: 'desc' }
    })
    
    if (latestSession) {
      console.log('\n🆕 Latest session:')
      console.log(`  Visitor: ${latestSession.visitorId}`)
      console.log(`  Device: ${latestSession.device}`)
      console.log(`  Location: ${latestSession.city}, ${latestSession.country}`)
      console.log(`  Page views: ${latestSession.pageViews}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLatestData()