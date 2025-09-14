import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const trackEventSchema = z.object({
  contentId: z.string(),
  event: z.enum(['VIEW', 'CLICK', 'CONVERSION', 'ENGAGEMENT']),
  placement: z.enum(['INLINE', 'SIDEBAR', 'FOOTER', 'RELATED']),
  recipeId: z.string().optional(),
  timestamp: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid timestamp'
  }),
  sessionId: z.string().optional(),
  engagementTime: z.number().optional(), // Time spent viewing in seconds
  scrollDepth: z.number().optional(), // Percentage of content scrolled
  clickPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = trackEventSchema.parse(body)

    // Generate session ID if not provided
    const sessionId = validatedData.sessionId || generateSessionId(request)
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if sponsored content exists
    const content = await prisma.sponsoredContent.findUnique({
      where: { id: validatedData.contentId }
    })

    if (!content) {
      return NextResponse.json({ error: 'Sponsored content not found' }, { status: 404 })
    }

    // Prevent duplicate views from same session within 5 minutes
    if (validatedData.event === 'VIEW') {
      const recentView = await prisma.sponsoredContentView.findFirst({
        where: {
          contentId: validatedData.contentId,
          sessionId,
          createdAt: {
            gte: new Date(Date.now() - 300000) // 5 minutes ago
          }
        }
      })

      if (recentView) {
        // Update engagement metrics for existing view
        await prisma.sponsoredContentView.update({
          where: { id: recentView.id },
          data: {
            engagementTime: validatedData.engagementTime || recentView.engagementTime,
            scrollDepth: validatedData.scrollDepth || recentView.scrollDepth,
            updatedAt: new Date()
          }
        })

        return NextResponse.json({ message: 'View engagement updated' })
      }
    }

    // Record the event
    if (validatedData.event === 'VIEW') {
      await prisma.sponsoredContentView.create({
        data: {
          contentId: validatedData.contentId,
          sessionId,
          ipAddress,
          userAgent,
          placement: validatedData.placement,
          recipeId: validatedData.recipeId,
          engagementTime: validatedData.engagementTime || 0,
          scrollDepth: validatedData.scrollDepth || 0,
          referrer: request.headers.get('referer'),
          createdAt: new Date(validatedData.timestamp)
        }
      })

      // Update content view count
      await prisma.sponsoredContent.update({
        where: { id: validatedData.contentId },
        data: {
          views: {
            increment: 1
          },
          lastViewAt: new Date()
        }
      })

    } else if (validatedData.event === 'CLICK') {
      await prisma.sponsoredContentClick.create({
        data: {
          contentId: validatedData.contentId,
          sessionId,
          ipAddress,
          userAgent,
          placement: validatedData.placement,
          recipeId: validatedData.recipeId,
          clickPositionX: validatedData.clickPosition?.x,
          clickPositionY: validatedData.clickPosition?.y,
          referrer: request.headers.get('referer'),
          createdAt: new Date(validatedData.timestamp)
        }
      })

      // Update content click count and revenue
      await prisma.sponsoredContent.update({
        where: { id: validatedData.contentId },
        data: {
          clicks: {
            increment: 1
          },
          revenue: {
            increment: content.bidAmount || 0.2
          },
          lastClickAt: new Date()
        }
      })

      // Update daily revenue tracking
      await updateDailyRevenue(validatedData.contentId, content.bidAmount || 0.2)

    } else if (validatedData.event === 'CONVERSION') {
      const conversionValue = calculateConversionValue(content)

      await prisma.sponsoredContentConversion.create({
        data: {
          contentId: validatedData.contentId,
          sessionId,
          ipAddress,
          userAgent,
          placement: validatedData.placement,
          recipeId: validatedData.recipeId,
          conversionValue,
          createdAt: new Date(validatedData.timestamp)
        }
      })

      // Update conversion metrics
      await prisma.sponsoredContent.update({
        where: { id: validatedData.contentId },
        data: {
          conversions: {
            increment: 1
          },
          conversionRevenue: {
            increment: conversionValue
          },
          lastConversionAt: new Date()
        }
      })

    } else if (validatedData.event === 'ENGAGEMENT') {
      // Update existing view with engagement data
      await prisma.sponsoredContentView.updateMany({
        where: {
          contentId: validatedData.contentId,
          sessionId,
          createdAt: {
            gte: new Date(Date.now() - 300000) // Within last 5 minutes
          }
        },
        data: {
          engagementTime: validatedData.engagementTime || 0,
          scrollDepth: validatedData.scrollDepth || 0,
          updatedAt: new Date()
        }
      })
    }

    // Update analytics aggregations
    await updateContentAnalytics(validatedData.contentId)

    // Update sponsor campaign analytics
    await updateSponsorAnalytics(content.sponsorName)

    return NextResponse.json({
      message: 'Event tracked successfully',
      eventId: generateEventId(validatedData)
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid tracking data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Sponsored content tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

// Get sponsored content analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const sponsorName = searchParams.get('sponsor')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (contentId) {
      const analytics = await getContentAnalytics(
        contentId,
        startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate ? new Date(endDate) : new Date()
      )
      return NextResponse.json(analytics)
    }

    if (sponsorName) {
      const analytics = await getSponsorAnalytics(
        sponsorName,
        startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate ? new Date(endDate) : new Date()
      )
      return NextResponse.json(analytics)
    }

    return NextResponse.json({ error: 'Content ID or sponsor name required' }, { status: 400 })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateSessionId(request: NextRequest): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return Buffer.from(`${ip}-${userAgent}-${Date.now()}`).toString('base64').slice(0, 32)
}

function generateEventId(data: any): string {
  return `event-${data.contentId}-${Date.now()}-${Math.random().toString(36).substring(2)}`
}

function calculateConversionValue(content: any): number {
  // Calculate conversion value based on content type and sponsor
  let baseValue = content.bidAmount || 0.2

  switch (content.contentType) {
    case 'PRODUCT':
      baseValue *= 15 // Higher value for product conversions
      break
    case 'RECIPE':
      baseValue *= 8 // Medium value for recipe engagement
      break
    case 'ARTICLE':
      baseValue *= 5 // Lower value for article reads
      break
    case 'VIDEO':
      baseValue *= 12 // High value for video completions
      break
  }

  // Add random factor for realistic variance
  return baseValue * (0.8 + Math.random() * 0.4)
}

async function updateDailyRevenue(contentId: string, revenue: number) {
  try {
    const today = new Date().toISOString().split('T')[0]

    await prisma.$executeRaw`
      INSERT INTO sponsored_content_daily_stats (content_id, date, revenue, clicks)
      VALUES (${contentId}, ${today}, ${revenue}, 1)
      ON CONFLICT (content_id, date)
      DO UPDATE SET
        revenue = sponsored_content_daily_stats.revenue + ${revenue},
        clicks = sponsored_content_daily_stats.clicks + 1
    `
  } catch (error) {
    console.error('Daily revenue update error:', error)
  }
}

async function updateContentAnalytics(contentId: string) {
  try {
    // Aggregate analytics for performance
    const analytics = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT scv.session_id) as unique_views,
        COUNT(scv.id) as total_views,
        AVG(scv.engagement_time) as avg_engagement_time,
        AVG(scv.scroll_depth) as avg_scroll_depth,
        COUNT(DISTINCT scc.session_id) as unique_clicks,
        COUNT(scc.id) as total_clicks,
        COUNT(sccon.id) as conversions
      FROM sponsored_content_views scv
      LEFT JOIN sponsored_content_clicks scc ON scv.content_id = scc.content_id
      LEFT JOIN sponsored_content_conversions sccon ON scv.content_id = sccon.content_id
      WHERE scv.content_id = ${contentId}
    ` as any[]

    const stats = analytics[0]
    const ctr = stats.total_views > 0 ? (stats.total_clicks / stats.total_views) * 100 : 0
    const conversionRate = stats.total_clicks > 0 ? (stats.conversions / stats.total_clicks) * 100 : 0

    // Update content with calculated metrics
    await prisma.sponsoredContent.update({
      where: { id: contentId },
      data: {
        ctr: ctr,
        conversionRate: conversionRate,
        avgEngagementTime: stats.avg_engagement_time || 0,
        avgScrollDepth: stats.avg_scroll_depth || 0,
        lastAnalyticsUpdate: new Date()
      }
    })
  } catch (error) {
    console.error('Content analytics update error:', error)
  }
}

async function updateSponsorAnalytics(sponsorName: string) {
  try {
    // Aggregate sponsor performance across all their content
    const sponsorStats = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT sc.id) as total_content,
        SUM(sc.views) as total_views,
        SUM(sc.clicks) as total_clicks,
        SUM(sc.revenue) as total_revenue,
        SUM(sc.conversions) as total_conversions,
        AVG(sc.ctr) as avg_ctr
      FROM sponsored_content sc
      WHERE sc.sponsor_name = ${sponsorName}
        AND sc.is_active = true
    ` as any[]

    // Could store this in a sponsor_analytics table for dashboard
    console.log(`Sponsor ${sponsorName} analytics:`, sponsorStats[0])
  } catch (error) {
    console.error('Sponsor analytics update error:', error)
  }
}

async function getContentAnalytics(contentId: string, startDate: Date, endDate: Date) {
  // This function would be similar to the one in sponsored-content/route.ts
  // Implementation would fetch detailed analytics for the specific content
  return {
    summary: {},
    dailyStats: [],
    topRecipes: [],
    engagementMetrics: {}
  }
}

async function getSponsorAnalytics(sponsorName: string, startDate: Date, endDate: Date) {
  // This function would aggregate analytics across all content from a sponsor
  return {
    totalContent: 0,
    totalRevenue: 0,
    topPerformingContent: [],
    campaignPerformance: {}
  }
}