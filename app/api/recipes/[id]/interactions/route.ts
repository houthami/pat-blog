import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { type, visitorId, value } = await request.json()
    const recipeId = params.id

    // Validate interaction type
    const validTypes = ['like', 'dislike', 'share', 'print', 'save', 'copy_ingredients', 'copy_url']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 })
    }

    // For like/dislike, we need to handle the toggle behavior
    if (type === 'like' || type === 'dislike') {
      const oppositeType = type === 'like' ? 'dislike' : 'like'

      // Remove opposite interaction if exists
      await prisma.recipeInteraction.deleteMany({
        where: {
          recipeId,
          visitorId,
          type: oppositeType
        }
      })

      // Check if same interaction already exists
      const existingInteraction = await prisma.recipeInteraction.findUnique({
        where: {
          visitorId_recipeId_type: {
            visitorId,
            recipeId,
            type
          }
        }
      })

      if (existingInteraction) {
        // Remove existing interaction (toggle off)
        await prisma.recipeInteraction.delete({
          where: { id: existingInteraction.id }
        })

        return NextResponse.json({
          action: 'removed',
          type,
          message: `${type} removed successfully`
        })
      } else {
        // Create new interaction
        const interaction = await prisma.recipeInteraction.create({
          data: {
            recipeId,
            visitorId,
            type,
            value
          }
        })

        return NextResponse.json({
          action: 'added',
          type,
          interaction,
          message: `${type} added successfully`
        })
      }
    } else {
      // For other interactions, just create or update
      const interaction = await prisma.recipeInteraction.upsert({
        where: {
          visitorId_recipeId_type: {
            visitorId,
            recipeId,
            type
          }
        },
        update: {
          value,
          updatedAt: new Date()
        },
        create: {
          recipeId,
          visitorId,
          type,
          value
        }
      })

      return NextResponse.json({
        action: 'recorded',
        interaction,
        message: `${type} recorded successfully`
      })
    }
  } catch (error) {
    console.error('Error handling recipe interaction:', error)
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = params.id
    const url = new URL(request.url)
    const visitorId = url.searchParams.get('visitorId')

    // Get interaction counts
    const interactionCounts = await prisma.recipeInteraction.groupBy({
      by: ['type'],
      where: { recipeId },
      _count: { type: true }
    })

    const counts = interactionCounts.reduce((acc, item) => {
      acc[item.type] = item._count.type
      return acc
    }, {} as Record<string, number>)

    // Get user's interactions if visitorId provided
    let userInteractions: string[] = []
    if (visitorId) {
      const interactions = await prisma.recipeInteraction.findMany({
        where: { recipeId, visitorId },
        select: { type: true }
      })
      userInteractions = interactions.map(i => i.type)
    }

    return NextResponse.json({
      counts: {
        likes: counts.like || 0,
        dislikes: counts.dislike || 0,
        shares: counts.share || 0,
        saves: counts.save || 0,
        prints: counts.print || 0,
        copyIngredients: counts.copy_ingredients || 0,
        copyUrl: counts.copy_url || 0
      },
      userInteractions
    })
  } catch (error) {
    console.error('Error fetching recipe interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}