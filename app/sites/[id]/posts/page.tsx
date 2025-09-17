import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import PostsListView from "@/components/posts/posts-list-view"

interface PostsPageProps {
  params: { id: string }
  searchParams: { page?: string; status?: string; search?: string }
}

async function getSiteWithPosts(
  siteId: string,
  userId: string,
  page: number = 1,
  status?: string,
  search?: string
) {
  try {
    const limit = 10

    // Get site first to verify ownership
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

    if (!site) {
      return null
    }

    // Build where clause for posts
    const where: any = {
      siteId: siteId,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              views: true,
              comments: true,
              interactions: true,
            },
          },
        },
      }),
      prisma.blog.count({ where }),
    ])

    return {
      site,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Error fetching site posts:', error)
    return null
  }
}

export default async function PostsPage({ params, searchParams }: PostsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const page = parseInt(searchParams.page || "1")
  const status = searchParams.status
  const search = searchParams.search

  const data = await getSiteWithPosts(params.id, session.user.id, page, status, search)

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <PostsListView
        site={data.site}
        posts={data.posts}
        pagination={data.pagination}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  )
}