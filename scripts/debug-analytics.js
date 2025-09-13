const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugAnalytics() {
  try {
    console.log('🔍 Debugging analytics for recipe: cmfidxxn90002v6vw8x0n9f4d')
    
    const recipeId = 'cmfidxxn90002v6vw8x0n9f4d'
    const periodDays = 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)
    
    console.log(`📅 Filtering views from: ${startDate.toISOString()}`)
    console.log(`📅 Current time: ${new Date().toISOString()}`)
    
    // Debug: Get ALL views for this recipe (no date filter)
    const allViews = await prisma.recipeView.findMany({
      where: { recipeId },
      select: { viewedAt: true, visitorId: true, timeSpent: true, scrollDepth: true },
      orderBy: { viewedAt: 'desc' },
      take: 10
    })
    
    console.log(`\n📊 Total views (all time): ${allViews.length}`)
    allViews.forEach((v, i) => {
      const isRecent = v.viewedAt >= startDate
      console.log(`  ${i+1}. ${v.viewedAt.toISOString()} (${isRecent ? '✅ RECENT' : '❌ OLD'}) - ${v.visitorId}`)
    })
    
    // Debug: Get views within date range
    const recentViews = await prisma.recipeView.findMany({
      where: {
        recipeId,
        viewedAt: { gte: startDate }
      }
    })
    
    console.log(`\n📊 Recent views (last ${periodDays} days): ${recentViews.length}`)
    
    if (recentViews.length > 0) {
      // Test the analytics queries
      const totalViews = await prisma.recipeView.count({
        where: {
          recipeId,
          viewedAt: { gte: startDate }
        }
      })
      
      const uniqueVisitorsResult = await prisma.recipeView.findMany({
        where: {
          recipeId,
          viewedAt: { gte: startDate }
        },
        select: { visitorId: true },
        distinct: ['visitorId']
      })
      
      const avgMetrics = await prisma.recipeView.aggregate({
        where: {
          recipeId,
          viewedAt: { gte: startDate }
        },
        _avg: {
          timeSpent: true,
          scrollDepth: true
        }
      })

      const bouncedCount = await prisma.recipeView.count({
        where: {
          recipeId,
          viewedAt: { gte: startDate },
          bounced: true
        }
      })
      
      console.log(`\n📈 Analytics Results:`)
      console.log(`  - Total Views: ${totalViews}`)
      console.log(`  - Unique Visitors: ${uniqueVisitorsResult.length}`)
      console.log(`  - Avg Time Spent: ${Math.round(avgMetrics._avg.timeSpent || 0)}s`)
      console.log(`  - Avg Scroll Depth: ${Math.round(avgMetrics._avg.scrollDepth || 0)}%`)
      console.log(`  - Bounced Count: ${bouncedCount}`)
      console.log(`  - Bounce Rate: ${totalViews > 0 ? Math.round((bouncedCount / totalViews) * 100) : 0}%`)
    } else {
      console.log('❌ No recent views found - analytics will show zeros')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAnalytics()