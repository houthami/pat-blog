import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns this site
    const site = await prisma.site.findUnique({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!site) {
      return NextResponse.json({ error: "Site not found or access denied" }, { status: 404 })
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

    // Check if slug already exists for this site
    const existingPost = await prisma.blog.findFirst({
      where: {
        siteId: params.id,
        slug: finalSlug,
      },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: "A post with this URL slug already exists" },
        { status: 400 }
      )
    }

    // Create the blog post
    const blog = await prisma.blog.create({
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
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        siteId: params.id,
        authorId: session.user.id,
      },
    })

    return NextResponse.json(blog, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns this site
    const site = await prisma.site.findUnique({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!site) {
      return NextResponse.json({ error: "Site not found or access denied" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const where: any = {
      siteId: params.id,
    }

    if (status) {
      where.status = status
    }

    const [posts, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              views: true,
              comments: true,
              interactions: true,
            },
          },
        },
      }),
      prisma.blog.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}