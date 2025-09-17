import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/blogs/public - Get published blogs for viewers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const search = searchParams.get("search")
    const authorId = searchParams.get("author")

    const skip = (page - 1) * limit

    // Build filter conditions for public blogs
    const where: any = {
      status: "PUBLISHED",
      isPrivate: false,
      publishedAt: {
        lte: new Date() // Only show blogs that are actually published
      }
    }

    if (category) {
      where.categories = {
        has: category
      }
    }

    if (tag) {
      where.tags = {
        has: tag
      }
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    const [blogs, totalCount] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          imageUrl: true,
          publishedAt: true,
          categories: true,
          tags: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              views: true,
              comments: {
                where: { approved: true }
              },
              interactions: true,
            }
          }
        }
      }),
      prisma.blog.count({ where })
    ])

    // Get popular categories and tags for filtering
    const [popularCategories, popularTags] = await Promise.all([
      prisma.blog.findMany({
        where: { status: "PUBLISHED", isPrivate: false },
        select: { categories: true }
      }).then(blogs => {
        const categories = blogs.flatMap(blog => blog.categories)
        const categoryCount = categories.reduce((acc, cat) => {
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        return Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([category, count]) => ({ category, count }))
      }),
      prisma.blog.findMany({
        where: { status: "PUBLISHED", isPrivate: false },
        select: { tags: true }
      }).then(blogs => {
        const tags = blogs.flatMap(blog => blog.tags)
        const tagCount = tags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        return Object.entries(tagCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 15)
          .map(([tag, count]) => ({ tag, count }))
      })
    ])

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      filters: {
        categories: popularCategories,
        tags: popularTags
      }
    })

  } catch (error) {
    console.error("Error fetching public blogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}