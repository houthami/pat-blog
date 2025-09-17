import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateShoppingListSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  recipeIds: z.array(z.string()).optional(),
  addItems: z.array(z.object({
    name: z.string(),
    quantity: z.string().optional(),
    category: z.string().optional()
  })).optional(),
  removeItems: z.array(z.string()).optional()
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

    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        recipes: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            ingredients: true
          }
        },
        items: {
          orderBy: [
            { isCompleted: 'asc' },
            { category: 'asc' },
            { createdAt: 'desc' }
          ]
        },
        _count: {
          select: {
            items: true,
            recipes: true
          }
        }
      }
    })

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 })
    }

    return NextResponse.json(shoppingList)
  } catch (error) {
    console.error('Shopping list fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
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
    const validatedData = updateShoppingListSchema.parse(body)

    // Check if shopping list exists and belongs to user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 })
    }

    // Update shopping list
    const updateData: any = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description

    if (validatedData.recipeIds) {
      updateData.recipes = {
        set: validatedData.recipeIds.map(id => ({ id }))
      }
    }

    const updatedList = await prisma.shoppingList.update({
      where: { id: params.id },
      data: updateData
    })

    // Handle item additions
    if (validatedData.addItems && validatedData.addItems.length > 0) {
      await prisma.shoppingListItem.createMany({
        data: validatedData.addItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          category: item.category || 'Other',
          isCompleted: false,
          shoppingListId: params.id
        }))
      })
    }

    // Handle item removals
    if (validatedData.removeItems && validatedData.removeItems.length > 0) {
      await prisma.shoppingListItem.deleteMany({
        where: {
          id: { in: validatedData.removeItems },
          shoppingListId: params.id
        }
      })
    }

    // Return updated shopping list
    const completeList = await prisma.shoppingList.findUnique({
      where: { id: params.id },
      include: {
        recipes: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        items: {
          orderBy: [
            { isCompleted: 'asc' },
            { category: 'asc' },
            { createdAt: 'desc' }
          ]
        },
        _count: {
          select: {
            items: true,
            recipes: true
          }
        }
      }
    })

    return NextResponse.json(completeList)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Shopping list update error:', error)
    return NextResponse.json(
      { error: 'Failed to update shopping list' },
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

    // Check if shopping list exists and belongs to user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 })
    }

    // Delete shopping list (items will be deleted via cascade)
    await prisma.shoppingList.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Shopping list deleted successfully' })
  } catch (error) {
    console.error('Shopping list deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete shopping list' },
      { status: 500 }
    )
  }
}