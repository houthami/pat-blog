import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import CreatePostForm from "@/components/posts/create-post-form"

interface NewPostPageProps {
  params: {
    id: string
  }
}

async function getSite(siteId: string, userId: string) {
  try {
    const site = await prisma.site.findUnique({
      where: {
        id: siteId,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        category: true,
      }
    })

    return site
  } catch (error) {
    console.error('Error fetching site:', error)
    return null
  }
}

export default async function NewPostPage({ params }: NewPostPageProps) {
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
            <p className="text-muted-foreground">
              Write a new blog post for {site.name}
            </p>
          </div>

          <CreatePostForm site={site} />
        </div>
      </div>
    </div>
  )
}