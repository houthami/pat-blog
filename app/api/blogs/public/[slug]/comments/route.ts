import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCommentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email().optional().or(z.literal("")),
  content: z.string().min(1, "Comment is required").max(1000, "Comment too long"),
  visitorId: z.string().min(1, "Visitor ID is required"),
  parentId: z.string().optional(), // For replies
})

// POST /api/blogs/public/[slug]/comments - Submit a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Find the blog
    const blog = await prisma.blog.findUnique({
      where: {
        slug: params.slug,
        status: "PUBLISHED",
        isPrivate: false,
        allowComments: true
      },
      select: { id: true }
    })

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found or comments not allowed" },
        { status: 404 }
      )
    }

    // Validate parent comment if this is a reply
    if (validatedData.parentId) {
      const parentComment = await prisma.blogComment.findUnique({
        where: {
          id: validatedData.parentId,
          blogId: blog.id
        }
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    const ipAddress = request.ip ||
                     request.headers.get("x-forwarded-for") ||
                     "unknown"
    const userAgent = request.headers.get("user-agent") || ""

    // Create the comment
    const comment = await prisma.blogComment.create({
      data: {
        blogId: blog.id,
        visitorId: validatedData.visitorId,
        name: validatedData.name,
        email: validatedData.email || null,
        content: validatedData.content,
        parentId: validatedData.parentId || null,
        approved: false, // Comments need approval by default
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Comment submitted successfully. It will appear after moderation.",
        commentId: comment.id
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 }
    )
  }
}