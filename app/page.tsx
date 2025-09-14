import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    // Authenticated users - redirect based on role
    const userRole = session.user.role

    if (userRole === "ADMIN" || userRole === "EDITOR") {
      redirect("/dashboard")
    } else if (userRole === "VISITOR") {
      redirect("/visitor-welcome")
    } else {
      // VIEWER, MEMBER, etc. - go to recipes
      redirect("/recipes")
    }
  } else {
    // Anonymous users - go to recipes for recipe discovery
    redirect("/recipes")
  }
}
