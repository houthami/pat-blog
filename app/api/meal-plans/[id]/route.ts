import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMealPlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }).optional(),
  addMeals: z.array(z.object({
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    recipeId: z.string().optional(),
    customMeal: z.string().optional(),
    servings: z.number().min(1).optional(),
    notes: z.string().optional()
  })).optional(),
  removeMeals: z.array(z.string()).optional(),
  updateMeals: z.array(z.object({
    id: z.string(),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }).optional(),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).optional(),
    recipeId: z.string().optional(),
    customMeal: z.string().optional(),
    servings: z.number().min(1).optional(),
    notes: z.string().optional()
  })).optional()
})

interface Props {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
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
      }
    })

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }

    // Calculate meal plan statistics
    const stats = calculateMealPlanStats(mealPlan)

    return NextResponse.json({
      ...mealPlan,
      stats
    })
  } catch (error) {
    console.error('Meal plan fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateMealPlanSchema.parse(body)

    // Check if meal plan exists and belongs to user
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }

    // Update meal plan basic info
    const updateData: any = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate)

    if (Object.keys(updateData).length > 0) {
      await prisma.mealPlan.update({
        where: { id: params.id },
        data: updateData
      })
    }

    // Handle meal additions
    if (validatedData.addMeals && validatedData.addMeals.length > 0) {
      await prisma.meal.createMany({
        data: validatedData.addMeals.map(meal => ({
          date: new Date(meal.date),
          mealType: meal.mealType,
          recipeId: meal.recipeId,
          customMeal: meal.customMeal,
          servings: meal.servings || 1,
          notes: meal.notes,
          mealPlanId: params.id
        }))
      })
    }

    // Handle meal updates
    if (validatedData.updateMeals && validatedData.updateMeals.length > 0) {
      for (const mealUpdate of validatedData.updateMeals) {
        const mealUpdateData: any = {}
        if (mealUpdate.date) mealUpdateData.date = new Date(mealUpdate.date)
        if (mealUpdate.mealType) mealUpdateData.mealType = mealUpdate.mealType
        if (mealUpdate.recipeId !== undefined) mealUpdateData.recipeId = mealUpdate.recipeId
        if (mealUpdate.customMeal !== undefined) mealUpdateData.customMeal = mealUpdate.customMeal
        if (mealUpdate.servings) mealUpdateData.servings = mealUpdate.servings
        if (mealUpdate.notes !== undefined) mealUpdateData.notes = mealUpdate.notes

        await prisma.meal.updateMany({
          where: {
            id: mealUpdate.id,
            mealPlanId: params.id
          },
          data: mealUpdateData
        })
      }
    }

    // Handle meal removals
    if (validatedData.removeMeals && validatedData.removeMeals.length > 0) {
      await prisma.meal.deleteMany({
        where: {
          id: { in: validatedData.removeMeals },
          mealPlanId: params.id
        }
      })
    }

    // Return updated meal plan
    const updatedPlan = await prisma.mealPlan.findUnique({
      where: { id: params.id },
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
      }
    })

    const stats = calculateMealPlanStats(updatedPlan!)

    return NextResponse.json({
      ...updatedPlan,
      stats
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid meal plan data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Meal plan update error:', error)
    return NextResponse.json(
      { error: 'Failed to update meal plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if meal plan exists and belongs to user
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }

    // Delete meal plan (meals will be deleted via cascade)
    await prisma.mealPlan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Meal plan deleted successfully' })
  } catch (error) {
    console.error('Meal plan deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete meal plan' },
      { status: 500 }
    )
  }
}

// Helper function to calculate meal plan statistics
function calculateMealPlanStats(mealPlan: any) {
  const totalMeals = mealPlan.meals.length
  const mealTypeCount = mealPlan.meals.reduce((acc: any, meal: any) => {
    acc[meal.mealType] = (acc[meal.mealType] || 0) + 1
    return acc
  }, {})

  const totalPrepTime = mealPlan.meals.reduce((total: number, meal: any) => {
    return total + (meal.recipe?.prepTime || 0)
  }, 0)

  const totalCookTime = mealPlan.meals.reduce((total: number, meal: any) => {
    return total + (meal.recipe?.cookTime || 0)
  }, 0)

  const uniqueRecipes = new Set(
    mealPlan.meals
      .filter((meal: any) => meal.recipeId)
      .map((meal: any) => meal.recipeId)
  ).size

  const daysSpanned = Math.ceil(
    (mealPlan.endDate.getTime() - mealPlan.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  return {
    totalMeals,
    mealTypeCount,
    totalPrepTime,
    totalCookTime,
    uniqueRecipes,
    daysSpanned,
    averageMealsPerDay: totalMeals / daysSpanned,
    completionRate: (mealPlan.meals.filter((meal: any) => meal.recipeId || meal.customMeal).length / totalMeals) * 100
  }
}