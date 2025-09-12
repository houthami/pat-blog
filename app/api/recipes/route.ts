import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        authorId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        published: true,
        createdAt: true,
        imageUrl: true,
      },
    })

    return NextResponse.json(recipes)
  } catch (error) {
    console.error("Failed to fetch recipes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, ingredients, instructions, imageUrl, published } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const recipe = await prisma.recipe.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ingredients: ingredients?.trim() || "",
        instructions: instructions?.trim() || "",
        imageUrl: imageUrl || null,
        published: Boolean(published),
        authorId: session.user.id,
      },
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error("Failed to create recipe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
