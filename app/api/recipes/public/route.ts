import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        status: 'PUBLISHED'  // Only show published recipes to public
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
            interactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to recent 20 recipes
    })

    return NextResponse.json({
      recipes,
      total: recipes.length
    })

  } catch (error) {
    console.error('Failed to fetch public recipes:', error)

    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    )
  }
}