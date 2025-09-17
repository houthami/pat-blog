import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import EditPostForm from "@/components/posts/edit-post-form"

interface EditPostPageProps {
  params: {
    id: string
    postId: string
  }
}

async function getPost(siteId: string, postId: string, userId: string) {
  try {
    const post = await prisma.blog.findUnique({
      where: {
        id: postId,
        siteId: siteId,
        site: {
          ownerId: userId,
        },
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            category: true,
          },
        },
      },
    })

    return post
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const post = await getPost(params.id, params.postId, session.user.id)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Edit Post</h1>
            <p className="text-muted-foreground">
              Editing "{post.title}" on {post.site.name}
            </p>
          </div>

          <EditPostForm post={post} site={post.site} />
        </div>
      </div>
    </div>
  )
}