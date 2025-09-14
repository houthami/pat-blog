import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { targetRole } = await request.json()

    // Validate role upgrade path
    const validUpgrades: Record<string, string[]> = {
      'VISITOR': ['VIEWER'],
      'VIEWER': ['EDITOR'], // Only admins can promote to EDITOR typically
    }

    const currentRole = session.user.role
    const allowedUpgrades = validUpgrades[currentRole] || []

    if (!allowedUpgrades.includes(targetRole)) {
      return NextResponse.json(
        {
          error: 'Invalid role upgrade',
          message: `Cannot upgrade from ${currentRole} to ${targetRole}`
        },
        { status: 400 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: targetRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      }
    })

    // Log the upgrade
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ROLE_UPGRADE',
        success: true,
        details: {
          from: currentRole,
          to: targetRole,
          method: 'self-upgrade'
        }
      }
    })

    return NextResponse.json({
      message: `Account successfully upgraded to ${targetRole}`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Account upgrade error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}