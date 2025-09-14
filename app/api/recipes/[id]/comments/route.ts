import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { content, rating } = await request.json()

    // Validate input
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check if recipe exists and is published
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: params.id,
        status: 'PUBLISHED'
      }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Create the comment
    const comment = await prisma.recipeComment.create({
      data: {
        recipeId: params.id,
        visitorId: user.id,
        name: user.name || 'Anonymous',
        email: user.email,
        content: content.trim(),
        rating: rating || null,
        approved: user.role === 'ADMIN' // Auto-approve admin comments
      }
    })

    return NextResponse.json({
      message: user.role === 'ADMIN' ? 'Comment posted successfully' : 'Comment submitted for approval',
      comment: {
        id: comment.id,
        content: comment.content,
        rating: comment.rating,
        name: comment.name,
        createdAt: comment.createdAt,
        approved: comment.approved
      }
    })

  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

// GET - Fetch approved comments for a recipe
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url)
    const includeUnapproved = url.searchParams.get('includeUnapproved') === 'true'

    // Check if user is admin/editor to see unapproved comments
    const session = await getServerSession(authOptions)
    let canSeeUnapproved = false

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      canSeeUnapproved = user?.role === 'ADMIN' || user?.role === 'EDITOR'
    }

    // Build where clause
    const whereClause: any = {
      recipeId: params.id
    }

    // Only include unapproved if user has permission and requested
    if (!canSeeUnapproved || !includeUnapproved) {
      whereClause.approved = true
    }

    const comments = await prisma.recipeComment.findMany({
      where: whereClause,
      select: {
        id: true,
        content: true,
        rating: true,
        name: true,
        approved: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate average rating
    const ratings = comments
      .filter(comment => comment.rating !== null && comment.approved)
      .map(comment => comment.rating!)

    const averageRating = ratings.length > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null

    return NextResponse.json({
      comments,
      averageRating,
      totalComments: comments.filter(c => c.approved).length,
      pendingComments: canSeeUnapproved ? comments.filter(c => !c.approved).length : 0
    })

  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}