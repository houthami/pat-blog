import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import UserDashboard from "@/components/dashboard/user-dashboard"

async function getUserSites(userId: string) {
  return await prisma.site.findMany({
    where: {
      ownerId: userId,
    },
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
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const sites = await getUserSites(session.user.id)

  // If user has sites, redirect to first site admin
  if (sites.length > 0 && session.user.role === "SITE_OWNER") {
    redirect(`/sites/${sites[0].id}/admin`)
  }

  return (
    <div className="min-h-screen bg-background">
      <UserDashboard user={session.user} sites={sites} />
    </div>
  )
}