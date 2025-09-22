import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const categories = await prisma.recipeCategory.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { recipes: true }
        }
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    const categoriesWithCount = categories.map(category => ({
      ...category,
      recipeCount: category._count.recipes
    }))

    return NextResponse.json(categoriesWithCount)
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      color = "#6B7280",
      icon,
      imageUrl,
      parentId,
      metaTitle,
      metaDescription,
      isActive = true,
      sortOrder = 0
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingCategory = await prisma.recipeCategory.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 400 }
      )
    }

    // Validate parent category exists if provided
    if (parentId) {
      const parentCategory = await prisma.recipeCategory.findUnique({
        where: { id: parentId }
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        )
      }
    }

    const category = await prisma.recipeCategory.create({
      data: {
        name,
        slug,
        description,
        color,
        icon,
        imageUrl,
        parentId,
        metaTitle,
        metaDescription,
        isActive,
        sortOrder
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { recipes: true }
        }
      }
    })

    return NextResponse.json({
      ...category,
      recipeCount: category._count.recipes
    })
  } catch (error) {
    console.error("Failed to create category:", error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
}