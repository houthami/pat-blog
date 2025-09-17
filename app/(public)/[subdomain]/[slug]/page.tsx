import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PublicPostView from "@/components/public/public-post-view"

interface PublicPostPageProps {
  params: { subdomain: string; slug: string }
}

async function getPostBySubdomainAndSlug(subdomain: string, slug: string) {
  try {
    const post = await prisma.blog.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        site: {
          subdomain,
          status: "ACTIVE",
        },
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            description: true,
            theme: true,
            primaryColor: true,
            category: true,
            tags: true,
          },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            views: true,
            comments: true,
            interactions: true,
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

export async function generateMetadata({ params }: PublicPostPageProps) {
  const post = await getPostBySubdomainAndSlug(params.subdomain, params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description || `Read ${post.title} on ${post.site.name}`,
    keywords: post.tags?.join(', '),
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description || `Read ${post.title} on ${post.site.name}`,
      type: 'article',
      url: `https://${post.site.subdomain}.yourdomain.com/${post.slug}`,
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
      publishedTime: post.publishedAt,
      authors: [post.author.name || post.author.email],
      section: post.site.category,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description || `Read ${post.title} on ${post.site.name}`,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  }
}

export default async function PublicPostPage({ params }: PublicPostPageProps) {
  const post = await getPostBySubdomainAndSlug(params.subdomain, params.slug)

  if (!post) {
    notFound()
  }

  // Track post view (you might want to implement analytics here)
  // await prisma.blogView.create({ data: { blogId: post.id } })

  return <PublicPostView post={post} />
}