"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Heart,
  ArrowLeft,
  Share2,
  Bookmark,
  User,
} from "lucide-react"

interface Post {
  id: string
  title: string
  slug: string
  description?: string
  content: string
  featuredImage?: string
  publishedAt: string
  tags: string[]
  isFeatured: boolean
  site: {
    id: string
    name: string
    subdomain: string
    description?: string
    theme: string
    primaryColor?: string
    category: string
    tags: string[]
  }
  author: {
    id: string
    name?: string
    email: string
  }
  _count: {
    views: number
    comments: number
    interactions: number
  }
}

interface PublicPostViewProps {
  post: Post
}

export default function PublicPostView({ post }: PublicPostViewProps) {
  const primaryColor = post.site.primaryColor || "#3b82f6"

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(' ').length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  // Simple markdown to HTML conversion for display
  const formatContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => (
        <p key={index} className="mb-4 leading-relaxed">
          {paragraph}
        </p>
      ))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/${post.site.subdomain}`} className="flex items-center gap-3 hover:opacity-80">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {post.site.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-bold">{post.site.name}</h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${post.site.subdomain}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Post Header */}
          <article>
            <header className="mb-8">
              {post.isFeatured && (
                <Badge className="mb-4" style={{ backgroundColor: primaryColor }}>
                  Featured Post
                </Badge>
              )}

              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {post.title}
              </h1>

              {post.description && (
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {post.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {(post.author.name || post.author.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {post.author.name || 'Author'}
                    </p>
                    <p className="text-xs">{post.author.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getReadingTime(post.content)} min read
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post._count.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post._count.comments} comments
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post._count.interactions} likes
                  </span>
                </div>
              </div>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mb-8">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Like
                </Button>
              </div>

              {post.featuredImage && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </header>

            {/* Post Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div className="text-foreground leading-relaxed">
                {formatContent(post.content)}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Post Footer */}
            <footer>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Like ({post._count.interactions})
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Published on {formatDate(post.publishedAt)}
                </div>
              </div>

              {/* Author Bio */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {(post.author.name || post.author.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {post.author.name || 'Author'}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        Writer at {post.site.name} • Passionate about {post.site.category}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{post.site.name}</span>
                        <span>•</span>
                        <span>{post.site.category}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </footer>
          </article>

          {/* Comments Section Placeholder */}
          <section className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Comments ({post._count.comments})</CardTitle>
                <CardDescription>
                  Join the conversation about this post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Comments feature coming soon!
                  </p>
                  <Button variant="outline">
                    Subscribe for updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Related Posts Placeholder */}
          <section className="mt-12">
            <h3 className="text-2xl font-bold mb-6">More from {post.site.name}</h3>
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <p className="text-muted-foreground mb-4">
                Related posts feature coming soon!
              </p>
              <Button variant="outline" asChild>
                <Link href={`/${post.site.subdomain}`}>
                  Browse all posts
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}