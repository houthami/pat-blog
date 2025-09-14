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

    const userId = session.user.id

    // Get user statistics
    const [
      savedRecipesCount,
      createdRecipesCount,
      commentsCount,
      interactionsCount
    ] = await Promise.all([
      // Count saved recipes (if you have a saved_recipes table)
      // For now, return mock data since we don't have this table yet
      Promise.resolve(Math.floor(Math.random() * 20 + 5)),

      // Count created recipes by user
      prisma.recipe.count({
        where: {
          authorId: userId,
          status: 'PUBLISHED'
        }
      }),

      // Count comments made by user (if you have comments table)
      // For now, return mock data
      Promise.resolve(Math.floor(Math.random() * 15 + 3)),

      // Count interactions by user (if you have interactions table)
      // For now, return mock data
      Promise.resolve(Math.floor(Math.random() * 50 + 10))
    ])

    const stats = {
      savedRecipes: savedRecipesCount,
      createdRecipes: createdRecipesCount,
      comments: commentsCount,
      interactions: interactionsCount
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch user stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    )
  }
}