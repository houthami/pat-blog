import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: params.id,
        published: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        ingredients: true,
        instructions: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true
          }
        }
      }
    })

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      )
    }

    // Parse JSON strings for ingredients and instructions
    const formattedRecipe = {
      ...recipe,
      ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
      instructions: recipe.instructions ? JSON.parse(recipe.instructions) : []
    }

    return NextResponse.json(formattedRecipe)
  } catch (error) {
    console.error("Failed to fetch recipe:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    )
  }
}