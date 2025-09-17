import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import SiteAdminDashboard from "@/components/sites/site-admin-dashboard"

interface SiteAdminPageProps {
  params: {
    id: string
  }
}

async function getSite(siteId: string, userId: string) {
  try {
    const site = await prisma.site.findUnique({
      where: {
        id: siteId,
        ownerId: userId, // Ensure user owns this site
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        blogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            _count: {
              select: {
                views: true,
                comments: true,
                interactions: true,
              }
            }
          }
        },
        _count: {
          select: {
            blogs: {
              where: { status: "PUBLISHED" }
            }
          }
        }
      }
    })

    return site
  } catch (error) {
    console.error('Error fetching site:', error)
    return null
  }
}

export default async function SiteAdminPage({ params }: SiteAdminPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const site = await getSite(params.id, session.user.id)

  if (!site) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteAdminDashboard site={site} />
    </div>
  )
}