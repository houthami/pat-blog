import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateBlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required").optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format").optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  allowComments: z.boolean().optional(),
  allowSharing: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().or(z.null()),
})

// GET /api/blogs/[id] - Get single blog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "SUPER_USER") {
      return NextResponse.json(
        { error: "Unauthorized - Super User access required" },
        { status: 403 }
      )
    }

    const blog = await prisma.blog.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id // Ensure user can only access their own blogs
      },
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
    })

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(blog)

  } catch (error) {
    console.error("Error fetching blog:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    )
  }
}

// PUT /api/blogs/[id] - Update blog
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "SUPER_USER") {
      return NextResponse.json(
        { error: "Unauthorized - Super User access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateBlogSchema.parse(body)

    // Check if blog exists and user owns it
    const existingBlog = await prisma.blog.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id
      }
    })

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      )
    }

    // Check if slug is being changed and already exists
    if (validatedData.slug && validatedData.slug !== existingBlog.slug) {
      const slugExists = await prisma.blog.findUnique({
        where: { slug: validatedData.slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      lastEditedAt: new Date(),
    }

    // Handle publishing logic
    if (validatedData.status === "PUBLISHED" && existingBlog.status !== "PUBLISHED") {
      updateData.publishedAt = new Date()
    } else if (validatedData.status !== "PUBLISHED") {
      updateData.publishedAt = null
    }

    // Handle scheduled publishing
    if (validatedData.scheduledAt) {
      updateData.scheduledAt = new Date(validatedData.scheduledAt)
    } else if (validatedData.scheduledAt === null) {
      updateData.scheduledAt = null
    }

    const updatedBlog = await prisma.blog.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(updatedBlog)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating blog:", error)
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    )
  }
}

// DELETE /api/blogs/[id] - Delete blog
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "SUPER_USER") {
      return NextResponse.json(
        { error: "Unauthorized - Super User access required" },
        { status: 403 }
      )
    }

    // Check if blog exists and user owns it
    const existingBlog = await prisma.blog.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id
      }
    })

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      )
    }

    // Delete the blog (cascade will handle related records)
    await prisma.blog.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error deleting blog:", error)
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    )
  }
}