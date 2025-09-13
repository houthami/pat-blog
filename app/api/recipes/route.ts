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

    // Find user by email to get correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "admin@pastry.com" }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        authorId: user.id,
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

    // Convert ingredients and instructions to arrays and then to JSON
    const ingredientsArray = ingredients?.trim() 
      ? ingredients.split('\n').filter((item: string) => item.trim()).map((item: string) => item.replace(/^[•\-\*]\s*/, '').trim())
      : []
    
    const instructionsArray = instructions?.trim()
      ? instructions.split('\n').filter((item: string) => item.trim()).map((item: string, index: number) => {
          // Remove any existing numbering and trim
          return item.replace(/^\d+\.\s*/, '').trim()
        })
      : []

    // Find user by email (since we know the email from session)
    let user = await prisma.user.findUnique({
      where: { email: session.user.email || "admin@pastry.com" }
    })

    if (!user) {
      // This shouldn't happen if user is logged in, but just in case
      throw new Error("User not found in database. Please contact support.")
    }

    console.log("Using existing user:", user.id, user.email)

    const recipe = await prisma.recipe.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ingredients: JSON.stringify(ingredientsArray),
        instructions: JSON.stringify(instructionsArray),
        imageUrl: imageUrl || null,
        published: Boolean(published),
        authorId: user.id,
      },
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error("Failed to create recipe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
