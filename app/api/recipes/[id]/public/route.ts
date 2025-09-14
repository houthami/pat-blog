import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: {
        id: params.id,
        status: 'PUBLISHED' // Only show published recipes to public
      },
      include: {
        author: {
          select: {
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            views: true,
            interactions: true,
            comments: true
          }
        }
      }
    })

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      )
    }

    // Track view (optional - create a view record)
    try {
      await prisma.recipeView.create({
        data: {
          recipeId: recipe.id,
          visitorId: request.headers.get('x-visitor-id') || 'anonymous',
          ipAddress: request.ip || request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent'),
        }
      })
    } catch (error) {
      // Silently fail if view tracking fails
      console.log('View tracking failed:', error)
    }

    return NextResponse.json(recipe)

  } catch (error) {
    console.error('Failed to fetch recipe:', error)

    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    )
  }
}