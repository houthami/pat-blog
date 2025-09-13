import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, ingredients, instructions, imageUrl, authorName = "Admin" } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Convert ingredients and instructions to arrays
    let ingredientsArray: string[] = []
    let instructionsArray: string[] = []

    if (ingredients) {
      if (Array.isArray(ingredients)) {
        ingredientsArray = ingredients
      } else if (typeof ingredients === 'string') {
        ingredientsArray = ingredients.split('\n')
          .filter(item => item.trim())
          .map(item => item.replace(/^[•\-\*]\s*/, '').trim())
      }
    }

    if (instructions) {
      if (Array.isArray(instructions)) {
        instructionsArray = instructions
      } else if (typeof instructions === 'string') {
        instructionsArray = instructions.split('\n')
          .filter(item => item.trim())
          .map(item => item.replace(/^\d+\.\s*/, '').trim())
      }
    }

    // Find or create user (using hardcoded admin for now)
    let user = await prisma.user.findUnique({
      where: { email: "admin@pastry.com" }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "admin@pastry.com",
          password: "admin123",
          name: authorName
        }
      })
    }

    const recipe = await prisma.recipe.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ingredients: JSON.stringify(ingredientsArray),
        instructions: JSON.stringify(instructionsArray),
        imageUrl: imageUrl || null,
        published: true, // Auto-publish blog posts
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Blog post created successfully",
      recipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        published: recipe.published,
        blogUrl: `${request.headers.get('origin') || 'http://localhost:3000'}/blog/recipe/${recipe.id}`,
        createdAt: recipe.createdAt
      }
    })
  } catch (error) {
    console.error("Failed to create blog post:", error)
    return NextResponse.json(
      { error: "Failed to create blog post", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}