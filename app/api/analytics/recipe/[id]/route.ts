import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days
    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Initialize default values
    let analytics = {
      overview: {
        totalViews: 0,
        uniqueVisitors: 0,
        avgTimeSpent: 0,
        avgScrollDepth: 0,
        bounceRate: 0,
        engagementScore: 0,
        revenue: { total: 0, transactions: 0 }
      },
      geography: { countries: [], cities: [] },
      technology: { devices: [] },
      timeline: { dailyViews: [] },
      interactions: []
    }

    try {
      // Get total views
      const totalViews = await prisma.recipeView.count({
        where: {
          recipeId: params.id,
          viewedAt: { gte: startDate }
        }
      })

      // Get unique visitors
      const uniqueVisitorsResult = await prisma.recipeView.findMany({
        where: {
          recipeId: params.id,
          viewedAt: { gte: startDate }
        },
        select: { visitorId: true },
        distinct: ['visitorId']
      })
      const uniqueVisitors = uniqueVisitorsResult.length

      // Get average metrics
      const avgMetrics = await prisma.recipeView.aggregate({
        where: {
          recipeId: params.id,
          viewedAt: { gte: startDate }
        },
        _avg: {
          timeSpent: true,
          scrollDepth: true
        }
      })

      // Get bounce rate separately (percentage of bounced views)
      const bounceRateData = await prisma.recipeView.aggregate({
        where: {
          recipeId: params.id,
          viewedAt: { gte: startDate }
        },
        _count: {
          bounced: true
        }
      })
      
      const bouncedCount = await prisma.recipeView.count({
        where: {
          recipeId: params.id,
          viewedAt: { gte: startDate },
          bounced: true
        }
      })

      // Get interactions
      const interactions = await prisma.recipeInteraction.groupBy({
        by: ['type'],
        where: {
          recipeId: params.id,
          createdAt: { gte: startDate }
        },
        _count: { type: true }
      })

      // Get revenue
      const revenue = await prisma.recipeRevenue.aggregate({
        where: {
          recipeId: params.id,
          createdAt: { gte: startDate }
        },
        _sum: { amount: true },
        _count: { id: true }
      })

      // Get top countries (raw query)
      const topCountries = await prisma.$queryRaw`
        SELECT country, COUNT(*) as views
        FROM recipe_views 
        WHERE recipeId = ${params.id} 
        AND viewedAt >= ${startDate.toISOString()}
        AND country IS NOT NULL
        GROUP BY country 
        ORDER BY views DESC 
        LIMIT 10
      `

      // Get top cities
      const topCities = await prisma.$queryRaw`
        SELECT city, country, COUNT(*) as views
        FROM recipe_views 
        WHERE recipeId = ${params.id} 
        AND viewedAt >= ${startDate.toISOString()}
        AND city IS NOT NULL
        GROUP BY city, country 
        ORDER BY views DESC 
        LIMIT 10
      `

      // Get device breakdown
      const deviceBreakdown = await prisma.$queryRaw`
        SELECT vs.device, COUNT(rv.id) as views
        FROM recipe_views rv
        JOIN visitor_sessions vs ON rv.visitorId = vs.visitorId
        WHERE rv.recipeId = ${params.id} 
        AND rv.viewedAt >= ${startDate.toISOString()}
        AND vs.device IS NOT NULL
        GROUP BY vs.device
        ORDER BY views DESC
      `

      // Calculate metrics
      const avgTimeSpent = Math.round(avgMetrics._avg.timeSpent || 0)
      const avgScrollDepth = Math.round(avgMetrics._avg.scrollDepth || 0)
      const bounceRate = totalViews > 0 ? Math.round((bouncedCount / totalViews) * 100) : 0

      // Calculate engagement score
      const engagementScore = Math.min(100, Math.round(
        (avgTimeSpent / 60) * 10 + // time weight
        (avgScrollDepth * 0.5) + // scroll weight  
        ((100 - bounceRate) * 0.3) + // bounce rate weight
        (interactions.length * 5) // interactions weight
      ))

      // Update analytics object
      analytics = {
        overview: {
          totalViews,
          uniqueVisitors,
          avgTimeSpent,
          avgScrollDepth,
          bounceRate,
          engagementScore,
          revenue: {
            total: (revenue._sum.amount || 0) / 100, // convert from cents
            transactions: revenue._count.id || 0
          }
        },
        geography: {
          countries: Array.isArray(topCountries) ? topCountries : [],
          cities: Array.isArray(topCities) ? topCities : []
        },
        technology: {
          devices: Array.isArray(deviceBreakdown) ? deviceBreakdown : []
        },
        timeline: {
          dailyViews: [] // Can add daily breakdown if needed
        },
        interactions: interactions.map(i => ({
          type: i.type,
          count: i._count.type
        }))
      }

    } catch (error) {
      console.error("Error fetching analytics details:", error)
      // Return default analytics if there's an error
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Failed to fetch recipe analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}