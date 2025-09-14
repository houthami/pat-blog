import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role = "VISITOR", source, recipeId } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists. Please sign in instead." },
        { status: 409 }
      )
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Extract name from email (fallback)
    const name = email.split('@')[0]

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as any,
      }
    })

    // Track the registration source
    if (source) {
      await prisma.userAction.create({
        data: {
          userId: user.id,
          action: "QUICK_REGISTER",
          metadata: {
            source,
            recipeId,
            timestamp: new Date().toISOString(),
          }
        }
      }).catch(() => {
        // Ignore if UserAction table doesn't exist
      })
    }

    // If they were saving a recipe, create the interaction
    if (recipeId) {
      try {
        await prisma.recipeInteraction.create({
          data: {
            userId: user.id,
            recipeId,
            type: "SAVE",
            visitorId: `user_${user.id}`,
          }
        })
      } catch (error) {
        // Recipe might not exist or interaction already created
        console.log("Could not save recipe interaction:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      tempPassword, // Send back for auto-login
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })

  } catch (error) {
    console.error("Quick registration error:", error)
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    )
  }
}