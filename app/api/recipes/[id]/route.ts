import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user by email to get correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "admin@pastry.com" }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const recipe = await prisma.recipe.findFirst({
      where: {
        id: params.id,
        authorId: user.id
      }
    })

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    return NextResponse.json(recipe)
  } catch (error) {
    console.error("Failed to fetch recipe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user by email to get correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "admin@pastry.com" }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: any = {}

    // Only update fields that are provided
    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.description !== undefined) updates.description = body.description?.trim() || null
    if (body.published !== undefined) updates.published = Boolean(body.published)
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null

    // Handle ingredients and instructions if provided
    if (body.ingredients !== undefined) {
      const ingredientsArray = body.ingredients?.trim() 
        ? body.ingredients.split('\n').filter((item: string) => item.trim()).map((item: string) => item.replace(/^[•\-\*]\s*/, '').trim())
        : []
      updates.ingredients = JSON.stringify(ingredientsArray)
    }

    if (body.instructions !== undefined) {
      const instructionsArray = body.instructions?.trim()
        ? body.instructions.split('\n').filter((item: string) => item.trim()).map((item: string) => {
            return item.replace(/^\d+\.\s*/, '').trim()
          })
        : []
      updates.instructions = JSON.stringify(instructionsArray)
    }

    const recipe = await prisma.recipe.update({
      where: {
        id: params.id,
        authorId: user.id
      },
      data: updates
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error("Failed to update recipe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user by email to get correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "admin@pastry.com" }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.recipe.delete({
      where: {
        id: params.id,
        authorId: user.id
      }
    })

    return NextResponse.json({ message: "Recipe deleted successfully" })
  } catch (error) {
    console.error("Failed to delete recipe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}