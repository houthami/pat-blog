import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import BlogManagerDashboard from "@/components/blog-manager/blog-manager-dashboard"

export default async function BlogManagerPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "SUPER_USER") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <BlogManagerDashboard />
    </div>
  )
}