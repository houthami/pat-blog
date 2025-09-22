import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.recipeCategory.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        recipes: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            status: true,
            createdAt: true
          },
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { recipes: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...category,
      recipeCount: category._count.recipes
    })
  } catch (error) {
    console.error("Failed to fetch category:", error)
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      color,
      icon,
      imageUrl,
      parentId,
      metaTitle,
      metaDescription,
      isActive,
      sortOrder
    } = body

    // Check if category exists
    const existingCategory = await prisma.recipeCategory.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if slug is taken by another category
    if (slug && slug !== existingCategory.slug) {
      const slugExists = await prisma.recipeCategory.findUnique({
        where: { slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 400 }
        )
      }
    }

    // Validate parent category exists if provided
    if (parentId && parentId !== existingCategory.parentId) {
      // Prevent circular references
      if (parentId === params.id) {
        return NextResponse.json(
          { error: "Category cannot be its own parent" },
          { status: 400 }
        )
      }

      const parentCategory = await prisma.recipeCategory.findUnique({
        where: { id: parentId }
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        )
      }

      // Check if the new parent is a descendant (would create circular reference)
      const descendants = await getDescendantIds(params.id)
      if (descendants.includes(parentId)) {
        return NextResponse.json(
          { error: "Cannot set parent to a descendant category" },
          { status: 400 }
        )
      }
    }

    const category = await prisma.recipeCategory.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(parentId !== undefined && { parentId }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder })
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
    console.error("Failed to update category:", error)
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if category exists
    const category = await prisma.recipeCategory.findUnique({
      where: { id: params.id },
      include: {
        children: true,
        _count: {
          select: { recipes: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories. Please delete or move subcategories first." },
        { status: 400 }
      )
    }

    // Check if category has recipes
    if (category._count.recipes > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${category._count.recipes} recipes. Please move or delete recipes first.` },
        { status: 400 }
      )
    }

    await prisma.recipeCategory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Failed to delete category:", error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
}

// Helper function to get all descendant category IDs
async function getDescendantIds(categoryId: string): Promise<string[]> {
  const descendants: string[] = []

  async function collectDescendants(id: string) {
    const children = await prisma.recipeCategory.findMany({
      where: { parentId: id },
      select: { id: true }
    })

    for (const child of children) {
      descendants.push(child.id)
      await collectDescendants(child.id)
    }
  }

  await collectDescendants(categoryId)
  return descendants
}