import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAdSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url().optional(),
  clickUrl: z.string().url(),
  provider: z.enum(['GOOGLE_ADSENSE', 'AMAZON', 'DIRECT', 'AFFILIATE']),
  placement: z.enum(['BANNER', 'SIDEBAR', 'CONTENT', 'FOOTER']),
  targetCategories: z.array(z.string()).optional(),
  targetKeywords: z.array(z.string()).optional(),
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

    const ads = await prisma.ad.findMany({
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

    // Calculate additional metrics
    const adsWithMetrics = ads.map(ad => ({
      ...ad,
      impressions: ad._count.views,
      clicks: ad._count.clicks,
      ctr: ad._count.views > 0 ? (ad._count.clicks / ad._count.views) * 100 : 0,
      revenue: calculateAdRevenue(ad._count.clicks, ad.bidAmount || 0.1)
    }))

    // Filter by targeting if recipeId provided
    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { ingredients: true, title: true, description: true }
      })

      if (recipe) {
        const relevantAds = adsWithMetrics.filter(ad =>
          isAdRelevant(ad, recipe)
        )
        return NextResponse.json(relevantAds)
      }
    }

    return NextResponse.json(adsWithMetrics)
  } catch (error) {
    console.error('Ads fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
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
      const validatedAds = body.map(ad => createAdSchema.parse(ad))

      const createdAds = await prisma.ad.createMany({
        data: validatedAds.map(ad => ({
          ...ad,
          startDate: ad.startDate ? new Date(ad.startDate) : null,
          endDate: ad.endDate ? new Date(ad.endDate) : null,
          createdBy: session.user.id
        }))
      })

      return NextResponse.json({
        message: `${createdAds.count} ads created successfully`,
        count: createdAds.count
      }, { status: 201 })
    }

    // Handle single creation
    const validatedData = createAdSchema.parse(body)

    const ad = await prisma.ad.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(ad, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid ad data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Ad creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create ad' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateAdRevenue(clicks: number, bidAmount: number): number {
  // Simple revenue calculation - in production integrate with actual ad networks
  return clicks * bidAmount
}

function isAdRelevant(ad: any, recipe: any): boolean {
  // Simple relevance check - in production use ML-based targeting
  if (!ad.targetKeywords || ad.targetKeywords.length === 0) {
    return true // No targeting = show to all
  }

  const recipeText = `${recipe.title} ${recipe.description} ${recipe.ingredients.join(' ')}`.toLowerCase()

  return ad.targetKeywords.some((keyword: string) =>
    recipeText.includes(keyword.toLowerCase())
  )
}