import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateAffiliateLinkSchema = z.object({
  productName: z.string().min(1).optional(),
  productDescription: z.string().optional(),
  productUrl: z.string().url().optional(),
  affiliateUrl: z.string().url().optional(),
  provider: z.enum(['AMAZON', 'TARGET', 'WALMART', 'WILLIAMS_SONOMA', 'CUSTOM']).optional(),
  category: z.string().optional(),
  price: z.number().min(0).optional(),
  commission: z.number().min(0).max(100).optional(),
  ingredients: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
})

interface Props {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAnalytics = searchParams.get('analytics') === 'true'
    const isPublic = searchParams.get('public') === 'true'

    if (!isPublic) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { id: params.id },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            status: true,
            ingredients: true
          }
        },
        _count: {
          select: {
            clicks: true
          }
        }
      }
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: 'Affiliate link not found' }, { status: 404 })
    }

    // For public requests, check if link is active and recipe is published
    if (isPublic && (!affiliateLink.isActive || affiliateLink.recipe?.status !== 'PUBLISHED')) {
      return NextResponse.json({ error: 'Affiliate link not found' }, { status: 404 })
    }

    // For public requests, return minimal data
    if (isPublic) {
      return NextResponse.json({
        id: affiliateLink.id,
        productName: affiliateLink.productName,
        productDescription: affiliateLink.productDescription,
        productUrl: affiliateLink.productUrl,
        affiliateUrl: affiliateLink.affiliateUrl,
        provider: affiliateLink.provider,
        category: affiliateLink.category,
        price: affiliateLink.price,
        ingredients: affiliateLink.ingredients
      })
    }

    let result: any = affiliateLink

    // Include analytics if requested
    if (includeAnalytics) {
      const analytics = await getDetailedAnalytics(params.id)
      result = {
        ...affiliateLink,
        analytics
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Affiliate link fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate link' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAffiliateLinkSchema.parse(body)

    // Check if affiliate link exists
    const existingLink = await prisma.affiliateLink.findUnique({
      where: { id: params.id }
    })

    if (!existingLink) {
      return NextResponse.json({ error: 'Affiliate link not found' }, { status: 404 })
    }

    // Update affiliate link
    const updatedLink = await prisma.affiliateLink.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            clicks: true
          }
        }
      }
    })

    return NextResponse.json(updatedLink)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid affiliate link data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Affiliate link update error:', error)
    return NextResponse.json(
      { error: 'Failed to update affiliate link' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if affiliate link exists
    const existingLink = await prisma.affiliateLink.findUnique({
      where: { id: params.id }
    })

    if (!existingLink) {
      return NextResponse.json({ error: 'Affiliate link not found' }, { status: 404 })
    }

    // Soft delete - deactivate instead of actual deletion to preserve analytics
    await prisma.affiliateLink.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Affiliate link deactivated successfully' })
  } catch (error) {
    console.error('Affiliate link deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete affiliate link' },
      { status: 500 }
    )
  }
}

// Get detailed analytics for a specific affiliate link
async function getDetailedAnalytics(linkId: string) {
  try {
    const [
      totalStats,
      dailyClicks,
      sourceBreakdown,
      topPerformingHours,
      conversionFunnel,
      recentClicks
    ] = await Promise.all([
      // Total statistics
      prisma.$queryRaw`
        SELECT
          COUNT(*) as total_clicks,
          COUNT(DISTINCT session_id) as unique_sessions,
          MIN(clicked_at) as first_click,
          MAX(clicked_at) as last_click
        FROM affiliate_link_clicks
        WHERE affiliate_link_id = ${linkId}
      `,

      // Daily clicks for last 30 days
      prisma.$queryRaw`
        SELECT
          DATE(clicked_at) as date,
          COUNT(*) as clicks,
          COUNT(DISTINCT session_id) as unique_clicks
        FROM affiliate_link_clicks
        WHERE affiliate_link_id = ${linkId}
          AND clicked_at >= DATE('now', '-30 days')
        GROUP BY DATE(clicked_at)
        ORDER BY date DESC
      `,

      // Source breakdown
      prisma.$queryRaw`
        SELECT
          source,
          COUNT(*) as clicks,
          COUNT(DISTINCT session_id) as unique_sessions,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
        FROM affiliate_link_clicks
        WHERE affiliate_link_id = ${linkId}
        GROUP BY source
        ORDER BY clicks DESC
      `,

      // Top performing hours
      prisma.$queryRaw`
        SELECT
          strftime('%H', clicked_at) as hour,
          COUNT(*) as clicks
        FROM affiliate_link_clicks
        WHERE affiliate_link_id = ${linkId}
        GROUP BY hour
        ORDER BY clicks DESC
        LIMIT 5
      `,

      // Conversion funnel (mock data - would integrate with actual purchase tracking)
      {
        impressions: Math.floor(Math.random() * 1000) + 500,
        clicks: 0, // Will be filled from actual data
        conversions: Math.floor(Math.random() * 10) + 1,
        revenue: (Math.random() * 100 + 20).toFixed(2)
      },

      // Recent clicks with details
      prisma.affiliateLinkClick.findMany({
        where: { affiliateLinkId: linkId },
        select: {
          source: true,
          clickedAt: true,
          sessionId: true,
          userAgent: true
        },
        orderBy: { clickedAt: 'desc' },
        take: 20
      })
    ])

    // Fill in actual clicks for conversion funnel
    const totalClicks = (totalStats as any)[0]?.total_clicks || 0
    conversionFunnel.clicks = totalClicks

    return {
      totalStats: totalStats[0],
      dailyClicks,
      sourceBreakdown,
      topPerformingHours,
      conversionFunnel,
      recentClicks,
      performance: {
        ctr: conversionFunnel.impressions > 0 ? (totalClicks / conversionFunnel.impressions * 100).toFixed(2) : 0,
        conversionRate: totalClicks > 0 ? (conversionFunnel.conversions / totalClicks * 100).toFixed(2) : 0,
        avgRevenuePerClick: totalClicks > 0 ? (Number(conversionFunnel.revenue) / totalClicks).toFixed(2) : 0
      }
    }
  } catch (error) {
    console.error('Detailed analytics error:', error)
    return {
      totalStats: { total_clicks: 0, unique_sessions: 0 },
      dailyClicks: [],
      sourceBreakdown: [],
      topPerformingHours: [],
      conversionFunnel: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
      recentClicks: [],
      performance: { ctr: 0, conversionRate: 0, avgRevenuePerClick: 0 }
    }
  }
}