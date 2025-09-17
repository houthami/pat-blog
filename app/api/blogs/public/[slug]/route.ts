import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/blogs/public/[slug] - Get single published blog by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const blog = await prisma.blog.findUnique({
      where: {
        slug: params.slug,
        status: "PUBLISHED",
        isPrivate: false,
        publishedAt: {
          lte: new Date()
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            email: false // Don't expose email publicly
          }
        },
        comments: {
          where: { approved: true },
          orderBy: { createdAt: "desc" },
          take: 50, // Limit comments for performance
          include: {
            replies: {
              where: { approved: true },
              orderBy: { createdAt: "asc" },
              take: 10 // Limit replies per comment
            }
          }
        },
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
    })

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      )
    }

    // Track blog view
    const visitorId = request.headers.get("x-visitor-id") ||
                     request.ip ||
                     "anonymous"

    const userAgent = request.headers.get("user-agent") || ""
    const ipAddress = request.ip ||
                     request.headers.get("x-forwarded-for") ||
                     "unknown"

    // Create blog view record (fire and forget - don't block response)
    prisma.blogView.create({
      data: {
        blogId: blog.id,
        visitorId,
        ipAddress,
        userAgent,
        // Could add more tracking data here (referrer, location, etc.)
      }
    }).catch(error => {
      console.error("Error tracking blog view:", error)
      // Don't fail the request if view tracking fails
    })

    // Get related blogs (same categories/tags)
    const relatedBlogs = await prisma.blog.findMany({
      where: {
        id: { not: blog.id },
        status: "PUBLISHED",
        isPrivate: false,
        OR: [
          { categories: { hasSome: blog.categories } },
          { tags: { hasSome: blog.tags } }
        ]
      },
      take: 4,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        imageUrl: true,
        publishedAt: true,
        author: {
          select: { name: true, image: true }
        }
      }
    })

    return NextResponse.json({
      blog,
      relatedBlogs
    })

  } catch (error) {
    console.error("Error fetching blog:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    )
  }
}

// POST /api/blogs/public/[slug] - Track blog interaction
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const { type, value, visitorId } = body

    if (!type || !visitorId) {
      return NextResponse.json(
        { error: "Type and visitorId are required" },
        { status: 400 }
      )
    }

    // Find the blog
    const blog = await prisma.blog.findUnique({
      where: {
        slug: params.slug,
        status: "PUBLISHED",
        isPrivate: false
      },
      select: { id: true }
    })

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      )
    }

    // Create or update interaction
    const interaction = await prisma.blogInteraction.upsert({
      where: {
        visitorId_blogId_type: {
          visitorId,
          blogId: blog.id,
          type
        }
      },
      update: {
        value,
        updatedAt: new Date()
      },
      create: {
        blogId: blog.id,
        visitorId,
        type,
        value
      }
    })

    return NextResponse.json({ success: true, interaction })

  } catch (error) {
    console.error("Error tracking blog interaction:", error)
    return NextResponse.json(
      { error: "Failed to track interaction" },
      { status: 500 }
    )
  }
}