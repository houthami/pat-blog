import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns this site and post
    const existingPost = await prisma.blog.findUnique({
      where: {
        id: params.postId,
        siteId: params.id,
        site: {
          ownerId: session.user.id,
        },
      },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found or access denied" }, { status: 404 })
    }

    const {
      title,
      slug,
      description,
      content,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      allowComments,
      isFeatured,
      tags,
    } = await request.json()

    // Validate required fields
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug?.trim() || title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if slug already exists for another post in this site
    if (finalSlug !== existingPost.slug) {
      const conflictingPost = await prisma.blog.findFirst({
        where: {
          siteId: params.id,
          slug: finalSlug,
          id: { not: params.postId },
        },
      })

      if (conflictingPost) {
        return NextResponse.json(
          { error: "A post with this URL slug already exists" },
          { status: 400 }
        )
      }
    }

    // Determine publishedAt date
    let publishedAt = existingPost.publishedAt

    // If changing from DRAFT to PUBLISHED for the first time
    if (status === "PUBLISHED" && existingPost.status === "DRAFT" && !publishedAt) {
      publishedAt = new Date()
    }
    // If changing from PUBLISHED to DRAFT
    else if (status === "DRAFT" && existingPost.status === "PUBLISHED") {
      publishedAt = null
    }

    // Update the blog post
    const blog = await prisma.blog.update({
      where: { id: params.postId },
      data: {
        title: title.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        content: content.trim(),
        status,
        featuredImage: featuredImage?.trim() || null,
        metaTitle: metaTitle?.trim() || null,
        metaDescription: metaDescription?.trim() || null,
        allowComments: allowComments ?? true,
        isFeatured: isFeatured ?? false,
        tags: tags || [],
        publishedAt,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(blog)
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns this site and post
    const existingPost = await prisma.blog.findUnique({
      where: {
        id: params.postId,
        siteId: params.id,
        site: {
          ownerId: session.user.id,
        },
      },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found or access denied" }, { status: 404 })
    }

    // Delete the post (this will also delete related views, comments, interactions due to cascade)
    await prisma.blog.delete({
      where: { id: params.postId },
    })

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns this site and get the post
    const post = await prisma.blog.findUnique({
      where: {
        id: params.postId,
        siteId: params.id,
        site: {
          ownerId: session.user.id,
        },
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            category: true,
          },
        },
        _count: {
          select: {
            views: true,
            comments: true,
            interactions: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found or access denied" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}