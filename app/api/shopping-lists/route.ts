import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createShoppingListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  recipeIds: z.array(z.string()).optional(),
  customItems: z.array(z.object({
    name: z.string(),
    quantity: z.string().optional(),
    category: z.string().optional()
  })).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')

    if (recipeId) {
      // Get shopping lists that contain this recipe
      const lists = await prisma.shoppingList.findMany({
        where: {
          userId: session.user.id,
          recipes: {
            some: {
              id: recipeId
            }
          }
        },
        include: {
          recipes: {
            select: {
              id: true,
              title: true,
              ingredients: true
            }
          },
          items: true,
          _count: {
            select: {
              items: true,
              recipes: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
      return NextResponse.json(lists)
    }

    // Get all shopping lists for user
    const lists = await prisma.shoppingList.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        recipes: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        items: true,
        _count: {
          select: {
            items: true,
            recipes: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(lists)
  } catch (error) {
    console.error('Shopping lists fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createShoppingListSchema.parse(body)

    // Create shopping list with items
    const shoppingList = await prisma.shoppingList.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        userId: session.user.id,
        recipes: validatedData.recipeIds ? {
          connect: validatedData.recipeIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        recipes: {
          select: {
            id: true,
            title: true,
            ingredients: true
          }
        }
      }
    })

    // Generate items from recipes
    const allItems: Array<{ name: string; quantity?: string; category: string; isCompleted: boolean }> = []

    // Add recipe ingredients
    for (const recipe of shoppingList.recipes) {
      for (const ingredient of recipe.ingredients) {
        const category = categorizeIngredient(ingredient)
        allItems.push({
          name: ingredient,
          category,
          isCompleted: false
        })
      }
    }

    // Add custom items
    if (validatedData.customItems) {
      for (const item of validatedData.customItems) {
        allItems.push({
          name: item.name,
          quantity: item.quantity,
          category: item.category || 'Other',
          isCompleted: false
        })
      }
    }

    // Create shopping list items
    if (allItems.length > 0) {
      await prisma.shoppingListItem.createMany({
        data: allItems.map(item => ({
          ...item,
          shoppingListId: shoppingList.id
        }))
      })
    }

    // Return complete shopping list
    const completeList = await prisma.shoppingList.findUnique({
      where: { id: shoppingList.id },
      include: {
        recipes: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        items: true,
        _count: {
          select: {
            items: true,
            recipes: true
          }
        }
      }
    })

    return NextResponse.json(completeList, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Shopping list creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create shopping list' },
      { status: 500 }
    )
  }
}

function categorizeIngredient(ingredient: string): string {
  const ingredient_lower = ingredient.toLowerCase()

  // Produce
  if (/tomato|lettuce|onion|garlic|pepper|carrot|celery|cucumber|spinach|herbs|basil|parsley|cilantro|thyme|rosemary|lemon|lime|apple|banana|berry|fruit|vegetable/.test(ingredient_lower)) {
    return 'Produce'
  }

  // Dairy
  if (/milk|cheese|butter|cream|yogurt|eggs?|dairy/.test(ingredient_lower)) {
    return 'Dairy'
  }

  // Meat & Seafood
  if (/chicken|beef|pork|fish|salmon|shrimp|turkey|lamb|meat|seafood/.test(ingredient_lower)) {
    return 'Meat & Seafood'
  }

  // Pantry
  if (/flour|sugar|salt|pepper|oil|vinegar|sauce|spice|baking|vanilla|rice|pasta|bread|cereal|canned|jar/.test(ingredient_lower)) {
    return 'Pantry'
  }

  // Frozen
  if (/frozen|ice/.test(ingredient_lower)) {
    return 'Frozen'
  }

  return 'Other'
}