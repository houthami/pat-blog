import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const scaleRecipeSchema = z.object({
  recipeId: z.string(),
  originalServings: z.number().min(1),
  targetServings: z.number().min(1),
  scaleFactor: z.number().min(0.1).max(10),
  scaledIngredients: z.array(z.object({
    original: z.string(),
    scaled: z.string(),
    amount: z.number().optional(),
    unit: z.string().optional()
  }))
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await request.json()
    const validatedData = scaleRecipeSchema.parse(body)

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: validatedData.recipeId }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Save scaling analytics
    const scalingData = {
      recipeId: validatedData.recipeId,
      originalServings: validatedData.originalServings,
      targetServings: validatedData.targetServings,
      scaleFactor: validatedData.scaleFactor,
      scaledIngredients: JSON.stringify(validatedData.scaledIngredients),
      userId: session?.user?.id || null, // Allow anonymous scaling
      sessionId: session?.user?.id ? null : generateSessionId(request),
      createdAt: new Date()
    }

    // Store in database for analytics
    await prisma.$executeRaw`
      INSERT INTO recipe_scaling_events (
        recipe_id, user_id, session_id, original_servings,
        target_servings, scale_factor, scaled_ingredients, created_at
      ) VALUES (
        ${scalingData.recipeId}, ${scalingData.userId}, ${scalingData.sessionId},
        ${scalingData.originalServings}, ${scalingData.targetServings},
        ${scalingData.scaleFactor}, ${scalingData.scaledIngredients}, ${scalingData.createdAt}
      ) ON CONFLICT (recipe_id, user_id, session_id, created_at) DO UPDATE SET
        target_servings = excluded.target_servings,
        scale_factor = excluded.scale_factor,
        scaled_ingredients = excluded.scaled_ingredients
    `

    // Update recipe engagement metrics
    await prisma.recipe.update({
      where: { id: validatedData.recipeId },
      data: {
        scalingCount: {
          increment: 1
        }
      }
    })

    // Track popular scaling ratios for insights
    const popularScales = await getPopularScaleFactors(validatedData.recipeId)

    return NextResponse.json({
      message: 'Scaling recorded successfully',
      scalingId: generateScalingId(validatedData),
      analytics: {
        popularScales,
        currentScale: validatedData.scaleFactor
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid scaling data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Recipe scaling error:', error)
    return NextResponse.json(
      { error: 'Failed to record scaling' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID required' }, { status: 400 })
    }

    // Get scaling analytics for recipe
    const scalingAnalytics = await getScalingAnalytics(recipeId)

    return NextResponse.json(scalingAnalytics)
  } catch (error) {
    console.error('Scaling analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scaling analytics' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateSessionId(request: NextRequest): string {
  // Generate session ID from IP and user agent for anonymous users
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return Buffer.from(`${ip}-${userAgent}`).toString('base64').slice(0, 32)
}

function generateScalingId(data: any): string {
  return `scale-${data.recipeId}-${Date.now()}`
}

async function getPopularScaleFactors(recipeId: string) {
  try {
    const results = await prisma.$queryRaw`
      SELECT
        scale_factor,
        target_servings,
        COUNT(*) as usage_count,
        AVG(scale_factor) as avg_scale
      FROM recipe_scaling_events
      WHERE recipe_id = ${recipeId}
      GROUP BY scale_factor, target_servings
      ORDER BY usage_count DESC
      LIMIT 5
    ` as Array<{
      scale_factor: number
      target_servings: number
      usage_count: number
      avg_scale: number
    }>

    return results.map(row => ({
      scaleFactor: row.scale_factor,
      targetServings: row.target_servings,
      usageCount: Number(row.usage_count),
      percentage: 0 // Will be calculated client-side
    }))
  } catch (error) {
    console.error('Popular scales fetch error:', error)
    return []
  }
}

async function getScalingAnalytics(recipeId: string) {
  try {
    const [totalScalings, popularScales, scaleDistribution] = await Promise.all([
      // Total scaling count
      prisma.$queryRaw`
        SELECT COUNT(*) as total_scalings
        FROM recipe_scaling_events
        WHERE recipe_id = ${recipeId}
      `,

      // Popular scale factors
      getPopularScaleFactors(recipeId),

      // Scale distribution
      prisma.$queryRaw`
        SELECT
          CASE
            WHEN scale_factor < 0.5 THEN 'Very Small (< 0.5x)'
            WHEN scale_factor < 1 THEN 'Small (0.5x - 1x)'
            WHEN scale_factor = 1 THEN 'Original (1x)'
            WHEN scale_factor <= 2 THEN 'Large (1x - 2x)'
            ELSE 'Very Large (> 2x)'
          END as scale_range,
          COUNT(*) as count
        FROM recipe_scaling_events
        WHERE recipe_id = ${recipeId}
        GROUP BY scale_range
        ORDER BY count DESC
      `
    ])

    return {
      totalScalings: (totalScalings as any)[0]?.total_scalings || 0,
      popularScales,
      scaleDistribution: scaleDistribution || [],
      insights: {
        mostPopularScale: popularScales[0]?.scaleFactor || 1,
        averageTargetServings: popularScales.reduce((sum, scale) =>
          sum + scale.targetServings * scale.usageCount, 0
        ) / popularScales.reduce((sum, scale) => sum + scale.usageCount, 1)
      }
    }
  } catch (error) {
    console.error('Scaling analytics error:', error)
    return {
      totalScalings: 0,
      popularScales: [],
      scaleDistribution: [],
      insights: {
        mostPopularScale: 1,
        averageTargetServings: 4
      }
    }
  }
}