import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAffiliateLinkSchema = z.object({
  recipeId: z.string(),
  productName: z.string().min(1),
  productDescription: z.string().optional(),
  productUrl: z.string().url(),
  affiliateUrl: z.string().url(),
  provider: z.enum(['AMAZON', 'TARGET', 'WALMART', 'WILLIAMS_SONOMA', 'CUSTOM']),
  category: z.string(),
  price: z.number().min(0).optional(),
  commission: z.number().min(0).max(100).optional(),
  ingredients: z.array(z.string()).optional(),
  isActive: z.boolean().default(true)
})

const trackClickSchema = z.object({
  linkId: z.string(),
  source: z.enum(['RECIPE_PAGE', 'SHOPPING_LIST', 'MEAL_PLAN']).optional(),
  sessionId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')
    const provider = searchParams.get('provider')
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public') === 'true'

    // Build where condition
    let whereCondition: any = {}

    if (recipeId) {
      whereCondition.recipeId = recipeId
    }

    if (provider) {
      whereCondition.provider = provider
    }

    if (category) {
      whereCondition.category = category
    }

    // For public requests, only show active links from published recipes
    if (isPublic) {
      whereCondition.isActive = true
      whereCondition.recipe = {
        status: 'PUBLISHED'
      }
    } else {
      // For admin/editor requests, require auth and ownership
      if (!session?.user?.id || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: whereCondition,
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // For public requests, don't include sensitive data
    if (isPublic) {
      return NextResponse.json(
        affiliateLinks.map(link => ({
          id: link.id,
          productName: link.productName,
          productDescription: link.productDescription,
          productUrl: link.productUrl,
          affiliateUrl: link.affiliateUrl,
          provider: link.provider,
          category: link.category,
          price: link.price,
          ingredients: link.ingredients,
          clickCount: link._count.clicks
        }))
      )
    }

    // For admin/editor, include analytics
    const linksWithAnalytics = await Promise.all(
      affiliateLinks.map(async (link) => {
        const analytics = await getAffiliateLinkAnalytics(link.id)
        return {
          ...link,
          analytics
        }
      })
    )

    return NextResponse.json(linksWithAnalytics)
  } catch (error) {
    console.error('Affiliate links fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate links' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Handle batch creation
    if (Array.isArray(body)) {
      const validatedLinks = body.map(link => createAffiliateLinkSchema.parse(link))

      const createdLinks = await prisma.affiliateLink.createMany({
        data: validatedLinks.map(link => ({
          ...link,
          createdBy: session.user.id
        }))
      })

      return NextResponse.json({
        message: `${createdLinks.count} affiliate links created successfully`,
        count: createdLinks.count
      }, { status: 201 })
    }

    // Handle single creation
    const validatedData = createAffiliateLinkSchema.parse(body)

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: validatedData.recipeId }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        ...validatedData,
        createdBy: session.user.id
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(affiliateLink, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid affiliate link data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Affiliate link creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create affiliate link' },
      { status: 500 }
    )
  }
}

// Track click endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = trackClickSchema.parse(body)

    // Generate session ID if not provided
    const sessionId = validatedData.sessionId || generateSessionId(request)

    // Record the click
    await prisma.affiliateLinkClick.create({
      data: {
        affiliateLinkId: validatedData.linkId,
        source: validatedData.source || 'RECIPE_PAGE',
        sessionId,
        clickedAt: new Date(),
        userAgent: request.headers.get('user-agent') || 'unknown',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Update click count
    await prisma.affiliateLink.update({
      where: { id: validatedData.linkId },
      data: {
        clickCount: {
          increment: 1
        },
        lastClickedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Click tracked successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid click data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Click tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
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

async function getAffiliateLinkAnalytics(linkId: string) {
  try {
    const [clickStats, recentClicks, topSources] = await Promise.all([
      // Click statistics
      prisma.$queryRaw`
        SELECT
          COUNT(*) as total_clicks,
          COUNT(DISTINCT session_id) as unique_clicks,
          DATE(clicked_at) as click_date,
          COUNT(*) as daily_clicks
        FROM affiliate_link_clicks
        WHERE affiliate_link_id = ${linkId}
          AND clicked_at >= DATE('now', '-30 days')
        GROUP BY DATE(clicked_at)
        ORDER BY click_date DESC
        LIMIT 30
      `,

      // Recent clicks
      prisma.affiliateLinkClick.findMany({
        where: { affiliateLinkId: linkId },
        select: {
          source: true,
          clickedAt: true,
          sessionId: true
        },
        orderBy: { clickedAt: 'desc' },
        take: 10
      }),

      // Top sources
      prisma.$queryRaw`
        SELECT
          source,
          COUNT(*) as click_count,
          COUNT(DISTINCT session_id) as unique_count
        FROM affiliate_link_clicks
        WHERE affiliate_link_id = ${linkId}
        GROUP BY source
        ORDER BY click_count DESC
      `
    ])

    return {
      clickStats,
      recentClicks,
      topSources,
      conversionRate: 0, // Would be calculated based on actual purchases
      estimatedRevenue: 0 // Would be calculated based on commission tracking
    }
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return {
      clickStats: [],
      recentClicks: [],
      topSources: [],
      conversionRate: 0,
      estimatedRevenue: 0
    }
  }
}