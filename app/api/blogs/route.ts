import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"]).default("DRAFT"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  allowComments: z.boolean().default(true),
  allowSharing: z.boolean().default(true),
  isPrivate: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
})

// GET /api/blogs - Get all blogs for super user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "SUPER_USER") {
      return NextResponse.json(
        { error: "Unauthorized - Super User access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {
      authorId: session.user.id,
    }

    if (status && status !== "all") {
      where.status = status
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
        orderBy: { updatedAt: "desc" },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              views: true,
              comments: true,
              interactions: true,
            }
          }
        }
      }),
      prisma.blog.count({ where })
    ])

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      }
    })

  } catch (error) {
    console.error("Error fetching blogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}

// POST /api/blogs - Create new blog
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "SUPER_USER") {
      return NextResponse.json(
        { error: "Unauthorized - Super User access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createBlogSchema.parse(body)

    // Check if slug already exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingBlog) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      )
    }

    // Create the blog
    const blog = await prisma.blog.create({
      data: {
        ...validatedData,
        authorId: session.user.id,
        publishedAt: validatedData.status === "PUBLISHED" ? new Date() : null,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(blog, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating blog:", error)
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    )
  }
}