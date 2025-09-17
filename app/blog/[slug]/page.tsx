import { notFound } from "next/navigation"
import BlogPostView from "@/components/blog/blog-post-view"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

async function getBlogPost(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/blogs/public/${slug}`, {
      cache: 'no-store' // Always fetch fresh data for blog posts
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const data = await getBlogPost(params.slug)

  if (!data?.blog) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.'
    }
  }

  const { blog } = data

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.description || `Read ${blog.title} on our blog`,
    keywords: blog.keywords?.join(', '),
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.description || `Read ${blog.title} on our blog`,
      type: 'article',
      publishedTime: blog.publishedAt,
      authors: [blog.author.name || 'Anonymous'],
      images: blog.imageUrl ? [blog.imageUrl] : [],
      tags: [...(blog.categories || []), ...(blog.tags || [])],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.description || `Read ${blog.title} on our blog`,
      images: blog.imageUrl ? [blog.imageUrl] : [],
    }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const data = await getBlogPost(params.slug)

  if (!data?.blog) {
    notFound()
  }

  return <BlogPostView initialData={data} slug={params.slug} />
}