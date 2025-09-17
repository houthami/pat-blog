import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(100, "Site name too long"),
  slug: z.string().min(1, "Slug is required").max(50, "Slug too long").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  subdomain: z.string().min(1, "Subdomain is required").max(30, "Subdomain too long").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  theme: z.string().default("default"),
  primaryColor: z.string().default("#3b82f6"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).default([]),
})

// GET /api/sites - Get user's sites
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const skip = (page - 1) * limit

    // Get sites owned by the user
    const [sites, totalCount] = await Promise.all([
      prisma.site.findMany({
        where: {
          ownerId: session.user.id,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              blogs: {
                where: { status: "PUBLISHED" }
              }
            }
          }
        }
      }),
      prisma.site.count({
        where: {
          ownerId: session.user.id,
        }
      })
    ])

    return NextResponse.json({
      sites,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      }
    })

  } catch (error) {
    console.error("Error fetching sites:", error)
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    )
  }
}

// POST /api/sites - Create new site
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createSiteSchema.parse(body)

    // Check if subdomain already exists
    const existingSubdomain = await prisma.site.findUnique({
      where: { subdomain: validatedData.subdomain }
    })

    if (existingSubdomain) {
      return NextResponse.json(
        { error: "Subdomain already exists" },
        { status: 409 }
      )
    }

    // Check if slug already exists for this user
    const existingSlug = await prisma.site.findFirst({
      where: {
        slug: validatedData.slug,
        ownerId: session.user.id
      }
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: "You already have a site with this slug" },
        { status: 409 }
      )
    }

    // Create the site
    const site = await prisma.site.create({
      data: {
        ...validatedData,
        ownerId: session.user.id,
        status: "ACTIVE", // Auto-approve for now
        launchedAt: new Date(),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Update user role to SITE_OWNER if they're just a VIEWER
    if (session.user.role === "VIEWER") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "SITE_OWNER" }
      })
    }

    return NextResponse.json(site, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating site:", error)
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    )
  }
}