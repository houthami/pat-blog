import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, return default notification settings
    // In a real app, you'd store these in a user_notification_settings table
    const defaultSettings = {
      emailNotifications: true,
      newRecipes: true,
      comments: true,
      weeklyDigest: false
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error("Failed to fetch notification settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await request.json()

    // For now, just return the settings as received
    // In a real app, you'd save these to a database
    console.log("Notification settings updated for user:", session.user.id, settings)

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to update notification settings:", error)
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    )
  }
}