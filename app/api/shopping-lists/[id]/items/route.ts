import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateItemSchema = z.object({
  itemId: z.string(),
  name: z.string().optional(),
  quantity: z.string().optional(),
  category: z.string().optional(),
  isCompleted: z.boolean().optional(),
  notes: z.string().optional()
})

const addItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().optional(),
  category: z.string().default('Other'),
  notes: z.string().optional()
})

interface Props {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addItemSchema.parse(body)

    // Check if shopping list exists and belongs to user
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 })
    }

    // Create new item
    const newItem = await prisma.shoppingListItem.create({
      data: {
        name: validatedData.name,
        quantity: validatedData.quantity,
        category: validatedData.category,
        notes: validatedData.notes,
        isCompleted: false,
        shoppingListId: params.id
      }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Shopping list item creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create shopping list item' },
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
    const validatedData = updateItemSchema.parse(body)

    // Check if shopping list exists and belongs to user
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 })
    }

    // Check if item exists in this shopping list
    const existingItem = await prisma.shoppingListItem.findFirst({
      where: {
        id: validatedData.itemId,
        shoppingListId: params.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Shopping list item not found' }, { status: 404 })
    }

    // Update item
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.isCompleted !== undefined) updateData.isCompleted = validatedData.isCompleted
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    const updatedItem = await prisma.shoppingListItem.update({
      where: { id: validatedData.itemId },
      data: updateData
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Shopping list item update error:', error)
    return NextResponse.json(
      { error: 'Failed to update shopping list item' },
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

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

    // Check if shopping list exists and belongs to user
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 })
    }

    // Check if item exists in this shopping list
    const existingItem = await prisma.shoppingListItem.findFirst({
      where: {
        id: itemId,
        shoppingListId: params.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Shopping list item not found' }, { status: 404 })
    }

    // Delete item
    await prisma.shoppingListItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ message: 'Shopping list item deleted successfully' })
  } catch (error) {
    console.error('Shopping list item deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete shopping list item' },
      { status: 500 }
    )
  }
}