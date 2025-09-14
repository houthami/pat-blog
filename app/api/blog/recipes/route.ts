import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Build where condition for search
    const where = search ? {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } }
      ]
    } : {}

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          createdAt: true,
          _count: {
            select: {
              views: true,
              interactions: true,
              comments: {
                where: { approved: true }
              }
            }
          }
        }
      }),
      prisma.recipe.count({ where })
    ])

    // Add author data and format counts
    const recipesWithAuthor = recipes.map(recipe => ({
      ...recipe,
      author: { name: "Admin" },
      _count: {
        interactions: recipe._count.interactions,
        views: recipe._count.views,
        comments: recipe._count.comments
      },
      averageRating: Number((Math.random() * 2 + 3).toFixed(1)) // Keep random rating for now
    }))

    return NextResponse.json({
      recipes: recipesWithAuthor,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Failed to fetch blog recipes:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    )
  }
}