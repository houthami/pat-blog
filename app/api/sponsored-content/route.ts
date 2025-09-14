import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSponsoredContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url().optional(),
  sponsorName: z.string().min(1),
  sponsorLogo: z.string().url().optional(),
  contentType: z.enum(['RECIPE', 'PRODUCT', 'ARTICLE', 'VIDEO']),
  ctaText: z.string().min(1),
  ctaUrl: z.string().url(),
  price: z.number().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  cookTime: z.number().min(0).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  tags: z.array(z.string()).default([]),
  targetCategories: z.array(z.string()).optional(),
  targetKeywords: z.array(z.string()).optional(),
  placement: z.enum(['INLINE', 'SIDEBAR', 'FOOTER', 'RELATED']),
  priority: z.number().min(0).max(100).default(50),
  bidAmount: z.number().min(0).optional(),
  dailyBudget: z.number().min(0).optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }).optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placement = searchParams.get('placement')
    const recipeId = searchParams.get('recipeId')
    const category = searchParams.get('category')
    const active = searchParams.get('active') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where condition
    let whereCondition: any = {}

    if (placement) {
      whereCondition.placement = placement
    }

    if (active) {
      whereCondition.isActive = true
      whereCondition.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
      whereCondition.AND = [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: new Date() } }
          ]
        }
      ]
    }

    const content = await prisma.sponsoredContent.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: {
            views: true,
            clicks: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { bidAmount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Calculate metrics and filter by targeting
    let processedContent = content.map(item => ({
      ...item,
      impressions: item._count.views,
      clicks: item._count.clicks,
      ctr: item._count.views > 0 ? (item._count.clicks / item._count.views) * 100 : 0,
      revenue: calculateContentRevenue(item._count.clicks, item.bidAmount || 0.2)
    }))

    // Apply targeting filters
    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { ingredients: true, title: true, description: true }
      })

      if (recipe) {
        processedContent = processedContent.filter(item =>
          isContentRelevant(item, recipe, category)
        )
      }
    }

    // Apply additional category filtering
    if (category && !recipeId) {
      processedContent = processedContent.filter(item =>
        !item.targetCategories?.length ||
        item.targetCategories.some(cat =>
          cat.toLowerCase().includes(category.toLowerCase())
        )
      )
    }

    return NextResponse.json(processedContent.slice(0, limit))
  } catch (error) {
    console.error('Sponsored content fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sponsored content' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Handle batch creation
    if (Array.isArray(body)) {
      const validatedContent = body.map(content => createSponsoredContentSchema.parse(content))

      const createdContent = await prisma.sponsoredContent.createMany({
        data: validatedContent.map(content => ({
          ...content,
          startDate: content.startDate ? new Date(content.startDate) : null,
          endDate: content.endDate ? new Date(content.endDate) : null,
          createdBy: session.user.id
        }))
      })

      return NextResponse.json({
        message: `${createdContent.count} sponsored content items created successfully`,
        count: createdContent.count
      }, { status: 201 })
    }

    // Handle single creation
    const validatedData = createSponsoredContentSchema.parse(body)

    const content = await prisma.sponsoredContent.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid sponsored content data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Sponsored content creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create sponsored content' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateContentRevenue(clicks: number, bidAmount: number): number {
  // Simple revenue calculation - in production integrate with actual partner networks
  return clicks * bidAmount
}

function isContentRelevant(content: any, recipe: any, category?: string | null): boolean {
  // Multi-factor relevance scoring
  let relevanceScore = 0

  // Keyword matching
  if (content.targetKeywords && content.targetKeywords.length > 0) {
    const recipeText = `${recipe.title} ${recipe.description} ${recipe.ingredients.join(' ')}`.toLowerCase()

    const matchingKeywords = content.targetKeywords.filter((keyword: string) =>
      recipeText.includes(keyword.toLowerCase())
    )

    relevanceScore += (matchingKeywords.length / content.targetKeywords.length) * 50
  }

  // Category matching
  if (content.targetCategories && content.targetCategories.length > 0 && category) {
    const categoryMatch = content.targetCategories.some((cat: string) =>
      cat.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(cat.toLowerCase())
    )

    relevanceScore += categoryMatch ? 30 : 0
  }

  // Content type relevance
  if (content.contentType === 'RECIPE') {
    relevanceScore += 20 // Recipe content is always relevant on recipe pages
  }

  // If no targeting specified, show to everyone
  if ((!content.targetKeywords || content.targetKeywords.length === 0) &&
      (!content.targetCategories || content.targetCategories.length === 0)) {
    relevanceScore = 100
  }

  return relevanceScore >= 30 // Minimum relevance threshold
}

// Get content performance analytics
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 })
    }

    const analytics = await getContentAnalytics(
      contentId,
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    )

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Content analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

async function getContentAnalytics(contentId: string, startDate: Date, endDate: Date) {
  try {
    const [summary, dailyStats, topRecipes, conversionFunnel] = await Promise.all([
      // Summary statistics
      prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT sv.session_id) as unique_views,
          COUNT(sv.id) as total_views,
          COUNT(DISTINCT sc.session_id) as unique_clicks,
          COUNT(sc.id) as total_clicks,
          COALESCE(AVG(sv.engagement_time), 0) as avg_engagement_time
        FROM sponsored_content_views sv
        LEFT JOIN sponsored_content_clicks sc ON sv.content_id = sc.content_id
        WHERE sv.content_id = ${contentId}
          AND sv.created_at BETWEEN ${startDate} AND ${endDate}
      `,

      // Daily performance
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          COUNT(DISTINCT session_id) as unique_views,
          COUNT(*) as views
        FROM sponsored_content_views
        WHERE content_id = ${contentId}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,

      // Top performing recipe contexts
      prisma.$queryRaw`
        SELECT
          recipe_id,
          COUNT(*) as views,
          COUNT(DISTINCT session_id) as unique_views
        FROM sponsored_content_views
        WHERE content_id = ${contentId}
          AND recipe_id IS NOT NULL
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY recipe_id
        ORDER BY views DESC
        LIMIT 10
      `,

      // Mock conversion funnel
      {
        views: 0, // Will be filled from actual data
        clicks: 0, // Will be filled from actual data
        conversions: Math.floor(Math.random() * 20) + 5,
        revenue: (Math.random() * 200 + 50).toFixed(2)
      }
    ])

    // Fill conversion funnel with actual data
    const stats = summary[0] as any
    conversionFunnel.views = stats?.total_views || 0
    conversionFunnel.clicks = stats?.total_clicks || 0

    return {
      summary: stats,
      dailyStats,
      topRecipes,
      conversionFunnel,
      performance: {
        ctr: stats?.total_views > 0 ? (stats.total_clicks / stats.total_views * 100).toFixed(2) : '0',
        conversionRate: stats?.total_clicks > 0 ? (conversionFunnel.conversions / stats.total_clicks * 100).toFixed(2) : '0',
        revenuePerView: stats?.total_views > 0 ? (Number(conversionFunnel.revenue) / stats.total_views).toFixed(2) : '0'
      }
    }
  } catch (error) {
    console.error('Content analytics fetch error:', error)
    return {
      summary: {},
      dailyStats: [],
      topRecipes: [],
      conversionFunnel: { views: 0, clicks: 0, conversions: 0, revenue: 0 },
      performance: { ctr: '0', conversionRate: '0', revenuePerView: '0' }
    }
  }
}