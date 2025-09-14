import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMealPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }),
  meals: z.array(z.object({
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    recipeId: z.string().optional(),
    customMeal: z.string().optional(),
    servings: z.number().min(1).optional(),
    notes: z.string().optional()
  })).min(1)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    let whereCondition: any = { userId: session.user.id }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)

      whereCondition.OR = [
        {
          startDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } }
          ]
        }
      ]
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: whereCondition,
      include: {
        meals: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                prepTime: true,
                cookTime: true,
                servings: true
              }
            }
          },
          orderBy: [
            { date: 'asc' },
            { mealType: 'asc' }
          ]
        },
        _count: {
          select: {
            meals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(mealPlans)
  } catch (error) {
    console.error('Meal plans fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
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
    const validatedData = createMealPlanSchema.parse(body)

    // Create meal plan with meals
    const mealPlan = await prisma.mealPlan.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        userId: session.user.id,
        meals: {
          create: validatedData.meals.map(meal => ({
            date: new Date(meal.date),
            mealType: meal.mealType,
            recipeId: meal.recipeId,
            customMeal: meal.customMeal,
            servings: meal.servings || 1,
            notes: meal.notes
          }))
        }
      },
      include: {
        meals: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                prepTime: true,
                cookTime: true,
                servings: true,
                ingredients: true
              }
            }
          }
        },
        _count: {
          select: {
            meals: true
          }
        }
      }
    })

    // Generate shopping list suggestions
    const shoppingListItems = await generateShoppingListFromMealPlan(mealPlan.id)

    return NextResponse.json({
      ...mealPlan,
      suggestedShoppingList: shoppingListItems
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid meal plan data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Meal plan creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    )
  }
}

// Helper function to generate shopping list from meal plan
async function generateShoppingListFromMealPlan(mealPlanId: string) {
  try {
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: {
        meals: {
          include: {
            recipe: {
              select: {
                ingredients: true,
                servings: true
              }
            }
          }
        }
      }
    })

    if (!mealPlan) return []

    const ingredientMap = new Map<string, {
      name: string
      totalQuantity: number
      unit: string
      category: string
      recipes: string[]
    }>()

    // Aggregate ingredients from all meals
    for (const meal of mealPlan.meals) {
      if (meal.recipe && meal.recipe.ingredients) {
        const scaleFactor = (meal.servings || 1) / (meal.recipe.servings || 1)

        for (const ingredient of meal.recipe.ingredients) {
          const parsed = parseIngredient(ingredient)
          const key = parsed.ingredient.toLowerCase()

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!
            if (parsed.amount && existing.unit === parsed.unit) {
              existing.totalQuantity += parsed.amount * scaleFactor
            }
            existing.recipes.push(`${meal.date.toISOString().split('T')[0]} ${meal.mealType}`)
          } else if (parsed.amount) {
            ingredientMap.set(key, {
              name: parsed.ingredient,
              totalQuantity: parsed.amount * scaleFactor,
              unit: parsed.unit,
              category: categorizeIngredient(ingredient),
              recipes: [`${meal.date.toISOString().split('T')[0]} ${meal.mealType}`]
            })
          }
        }
      }
    }

    // Convert to array and format
    return Array.from(ingredientMap.values()).map(item => ({
      name: `${formatAmount(item.totalQuantity)} ${item.unit} ${item.name}`.trim(),
      category: item.category,
      recipes: item.recipes,
      quantity: item.totalQuantity,
      unit: item.unit
    }))

  } catch (error) {
    console.error('Shopping list generation error:', error)
    return []
  }
}

// Ingredient parsing helper (same as shopping list)
function parseIngredient(ingredient: string): {
  amount: number | null
  unit: string
  ingredient: string
} {
  const fractionRegex = /^(\d+\/\d+|\d+\s+\d+\/\d+|\d+\.?\d*)/
  const match = ingredient.match(fractionRegex)

  if (match) {
    const amountStr = match[1]
    let amount: number

    if (amountStr.includes('/')) {
      if (amountStr.includes(' ')) {
        const [whole, fraction] = amountStr.split(' ')
        const [num, den] = fraction.split('/').map(Number)
        amount = Number(whole) + num / den
      } else {
        const [num, den] = amountStr.split('/').map(Number)
        amount = num / den
      }
    } else {
      amount = Number(amountStr)
    }

    const remainder = ingredient.replace(fractionRegex, '').trim()
    const words = remainder.split(' ')
    const unit = words[0] || ''
    const ingredientName = words.slice(1).join(' ') || remainder

    return { amount, unit, ingredient: ingredientName }
  }

  return { amount: null, unit: '', ingredient: ingredient }
}

function formatAmount(amount: number): string {
  if (amount % 1 === 0) return amount.toString()
  return amount.toFixed(2).replace(/\.?0+$/, '')
}

function categorizeIngredient(ingredient: string): string {
  const ingredient_lower = ingredient.toLowerCase()

  if (/tomato|lettuce|onion|garlic|pepper|carrot|celery|cucumber|spinach|herbs|basil|parsley|cilantro|thyme|rosemary|lemon|lime|apple|banana|berry|fruit|vegetable/.test(ingredient_lower)) {
    return 'Produce'
  }

  if (/milk|cheese|butter|cream|yogurt|eggs?|dairy/.test(ingredient_lower)) {
    return 'Dairy'
  }

  if (/chicken|beef|pork|fish|salmon|shrimp|turkey|lamb|meat|seafood/.test(ingredient_lower)) {
    return 'Meat & Seafood'
  }

  if (/flour|sugar|salt|pepper|oil|vinegar|sauce|spice|baking|vanilla|rice|pasta|bread|cereal|canned|jar/.test(ingredient_lower)) {
    return 'Pantry'
  }

  if (/frozen|ice/.test(ingredient_lower)) {
    return 'Frozen'
  }

  return 'Other'
}