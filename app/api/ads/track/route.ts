import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const trackEventSchema = z.object({
  adId: z.string(),
  event: z.enum(['IMPRESSION', 'CLICK', 'CONVERSION']),
  placement: z.enum(['BANNER', 'SIDEBAR', 'CONTENT', 'FOOTER']),
  recipeId: z.string().optional(),
  timestamp: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid timestamp'
  }),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = trackEventSchema.parse(body)

    // Generate session ID if not provided
    const sessionId = validatedData.sessionId || generateSessionId(request)
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = validatedData.userAgent || request.headers.get('user-agent') || 'unknown'

    // Check if ad exists
    const ad = await prisma.ad.findUnique({
      where: { id: validatedData.adId }
    })

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // Prevent duplicate impressions from same session within 1 minute
    if (validatedData.event === 'IMPRESSION') {
      const recentImpression = await prisma.adView.findFirst({
        where: {
          adId: validatedData.adId,
          sessionId,
          createdAt: {
            gte: new Date(Date.now() - 60000) // 1 minute ago
          }
        }
      })

      if (recentImpression) {
        return NextResponse.json({ message: 'Duplicate impression ignored' })
      }
    }

    // Record the event
    if (validatedData.event === 'IMPRESSION') {
      await prisma.adView.create({
        data: {
          adId: validatedData.adId,
          sessionId,
          ipAddress,
          userAgent,
          placement: validatedData.placement,
          recipeId: validatedData.recipeId,
          referrer: validatedData.referrer || request.headers.get('referer'),
          createdAt: new Date(validatedData.timestamp)
        }
      })

      // Update ad impression count
      await prisma.ad.update({
        where: { id: validatedData.adId },
        data: {
          impressions: {
            increment: 1
          },
          lastImpressionAt: new Date()
        }
      })

    } else if (validatedData.event === 'CLICK') {
      await prisma.adClick.create({
        data: {
          adId: validatedData.adId,
          sessionId,
          ipAddress,
          userAgent,
          placement: validatedData.placement,
          recipeId: validatedData.recipeId,
          referrer: validatedData.referrer || request.headers.get('referer'),
          createdAt: new Date(validatedData.timestamp)
        }
      })

      // Update ad click count and revenue
      await prisma.ad.update({
        where: { id: validatedData.adId },
        data: {
          clicks: {
            increment: 1
          },
          revenue: {
            increment: ad.bidAmount || 0.1
          },
          lastClickAt: new Date()
        }
      })

      // Update daily revenue tracking
      await updateDailyRevenue(validatedData.adId, ad.bidAmount || 0.1)

    } else if (validatedData.event === 'CONVERSION') {
      await prisma.adConversion.create({
        data: {
          adId: validatedData.adId,
          sessionId,
          ipAddress,
          userAgent,
          placement: validatedData.placement,
          recipeId: validatedData.recipeId,
          conversionValue: ad.bidAmount ? ad.bidAmount * 10 : 1, // Mock conversion value
          createdAt: new Date(validatedData.timestamp)
        }
      })

      // Update conversion count
      await prisma.ad.update({
        where: { id: validatedData.adId },
        data: {
          conversions: {
            increment: 1
          },
          lastConversionAt: new Date()
        }
      })
    }

    // Analytics aggregation for better performance
    await updateAdAnalytics(validatedData.adId)

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

    console.error('Ad tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

// Get ad analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adId = searchParams.get('adId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!adId) {
      return NextResponse.json({ error: 'Ad ID required' }, { status: 400 })
    }

    const analytics = await getAdAnalytics(
      adId,
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    )

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Ad analytics error:', error)
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
  return `event-${data.adId}-${Date.now()}-${Math.random().toString(36).substring(2)}`
}

async function updateDailyRevenue(adId: string, revenue: number) {
  try {
    const today = new Date().toISOString().split('T')[0]

    await prisma.$executeRaw`
      INSERT INTO ad_daily_stats (ad_id, date, revenue, clicks)
      VALUES (${adId}, ${today}, ${revenue}, 1)
      ON CONFLICT (ad_id, date)
      DO UPDATE SET
        revenue = ad_daily_stats.revenue + ${revenue},
        clicks = ad_daily_stats.clicks + 1
    `
  } catch (error) {
    console.error('Daily revenue update error:', error)
  }
}

async function updateAdAnalytics(adId: string) {
  try {
    // Update aggregated analytics for better query performance
    const analytics = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT av.session_id) as unique_impressions,
        COUNT(av.id) as total_impressions,
        COUNT(DISTINCT ac.session_id) as unique_clicks,
        COUNT(ac.id) as total_clicks,
        COUNT(DISTINCT acv.session_id) as unique_conversions,
        COUNT(acv.id) as total_conversions
      FROM ad_views av
      LEFT JOIN ad_clicks ac ON av.ad_id = ac.ad_id AND av.session_id = ac.session_id
      LEFT JOIN ad_conversions acv ON av.ad_id = acv.ad_id AND av.session_id = acv.session_id
      WHERE av.ad_id = ${adId}
    ` as any[]

    const stats = analytics[0]
    const ctr = stats.total_impressions > 0 ? (stats.total_clicks / stats.total_impressions) * 100 : 0
    const conversionRate = stats.total_clicks > 0 ? (stats.total_conversions / stats.total_clicks) * 100 : 0

    // Update ad with calculated metrics
    await prisma.ad.update({
      where: { id: adId },
      data: {
        ctr: ctr,
        conversionRate: conversionRate,
        lastAnalyticsUpdate: new Date()
      }
    })

  } catch (error) {
    console.error('Analytics update error:', error)
  }
}

async function getAdAnalytics(adId: string, startDate: Date, endDate: Date) {
  try {
    const [summary, dailyStats, topPlacements, topRecipes] = await Promise.all([
      // Summary statistics
      prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT av.session_id) as unique_impressions,
          COUNT(av.id) as total_impressions,
          COUNT(DISTINCT ac.session_id) as unique_clicks,
          COUNT(ac.id) as total_clicks,
          COUNT(acv.id) as conversions,
          COALESCE(SUM(acv.conversion_value), 0) as total_revenue
        FROM ad_views av
        LEFT JOIN ad_clicks ac ON av.ad_id = ac.ad_id
        LEFT JOIN ad_conversions acv ON av.ad_id = acv.ad_id
        WHERE av.ad_id = ${adId}
          AND av.created_at BETWEEN ${startDate} AND ${endDate}
      `,

      // Daily performance
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          COUNT(DISTINCT session_id) as unique_impressions,
          COUNT(*) as impressions
        FROM ad_views
        WHERE ad_id = ${adId}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,

      // Top performing placements
      prisma.$queryRaw`
        SELECT
          placement,
          COUNT(*) as impressions,
          COUNT(DISTINCT session_id) as unique_impressions
        FROM ad_views
        WHERE ad_id = ${adId}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY placement
        ORDER BY impressions DESC
      `,

      // Top performing recipes
      prisma.$queryRaw`
        SELECT
          recipe_id,
          COUNT(*) as impressions,
          COUNT(DISTINCT session_id) as unique_impressions
        FROM ad_views
        WHERE ad_id = ${adId}
          AND recipe_id IS NOT NULL
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY recipe_id
        ORDER BY impressions DESC
        LIMIT 10
      `
    ])

    return {
      summary: summary[0],
      dailyStats,
      topPlacements,
      topRecipes
    }
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return {
      summary: {},
      dailyStats: [],
      topPlacements: [],
      topRecipes: []
    }
  }
}