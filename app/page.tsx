import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    // Authenticated users - redirect based on role
    const userRole = session.user.role

    if (userRole === "PLATFORM_ADMIN") {
      redirect("/admin")
    } else if (userRole === "SITE_OWNER") {
      // Check if user has sites, redirect to first site or create site page
      redirect("/dashboard")
    } else {
      // VIEWER - go to discover sites
      redirect("/discover")
    }
  } else {
    // Anonymous users - show landing page or go to discover
    redirect("/discover")
  }
}
