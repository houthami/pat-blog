"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Heart,
  User,
  Globe,
  Search,
  Mail,
} from "lucide-react"

interface Site {
  id: string
  name: string
  subdomain: string
  description?: string
  theme: string
  primaryColor?: string
  category: string
  tags: string[]
  totalViews: number
  totalPosts: number
  totalSubscribers: number
  createdAt: string
  owner: {
    id: string
    name?: string
    email: string
  }
  blogs: Array<{
    id: string
    title: string
    slug: string
    description?: string
    content: string
    featuredImage?: string
    publishedAt: string
    tags: string[]
    isFeatured: boolean
    _count: {
      views: number
      comments: number
      interactions: number
    }
  }>
  _count: {
    blogs: number
  }
}

interface PublicSiteViewProps {
  site: Site
}

export default function PublicSiteView({ site }: PublicSiteViewProps) {
  const primaryColor = site.primaryColor || "#3b82f6"
  const featuredPosts = site.blogs.filter(blog => blog.isFeatured).slice(0, 3)
  const recentPosts = site.blogs.slice(0, 6)

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

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {site.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{site.name}</h1>
                <p className="text-sm text-muted-foreground capitalize">{site.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {site._count.blogs} posts
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {site.totalViews.toLocaleString()} views
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-background to-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{site.name}</h2>
            {site.description && (
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {site.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {(site.owner.name || site.owner.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium">{site.owner.name || 'Author'}</p>
                  <p className="text-sm text-muted-foreground">
                    {site._count.blogs} posts • {site.totalViews.toLocaleString()} views
                  </p>
                </div>
              </div>
            </div>

            {site.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {site.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-bold mb-8">Featured Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  {post.featuredImage && (
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.publishedAt)}
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      {getReadingTime(post.content)} min read
                    </div>
                    <CardTitle className="line-clamp-2">
                      <Link href={`/${site.subdomain}/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </CardTitle>
                    {post.description && (
                      <CardDescription className="line-clamp-3">
                        {post.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post._count.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post._count.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post._count.interactions}
                        </span>
                      </div>
                      <Badge>Featured</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8">Recent Posts</h3>
          {recentPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  {post.featuredImage && (
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.publishedAt)}
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      {getReadingTime(post.content)} min read
                    </div>
                    <CardTitle className="line-clamp-2">
                      <Link href={`/${site.subdomain}/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </CardTitle>
                    {post.description && (
                      <CardDescription className="line-clamp-3">
                        {post.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post._count.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post._count.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post._count.interactions}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {site._count.blogs > 6 && (
            <div className="text-center mt-8">
              <Button variant="outline">
                View All Posts ({site._count.blogs})
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {site.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-lg font-semibold">{site.name}</h4>
            </div>
            <p className="text-muted-foreground mb-4">
              {site.description || `A ${site.category} blog by ${site.owner.name || 'our author'}`}
            </p>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(site.createdAt)} • Powered by PastryBlog
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}