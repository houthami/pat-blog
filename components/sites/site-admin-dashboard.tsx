"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Globe,
  Plus,
  Eye,
  MessageCircle,
  Heart,
  Edit,
  Settings,
  BarChart3,
  ExternalLink,
  Calendar,
  Users,
  TrendingUp
} from "lucide-react"

interface Site {
  id: string
  name: string
  slug: string
  subdomain: string
  description?: string
  status: string
  category: string
  tags: string[]
  theme: string
  primaryColor?: string
  totalViews: number
  totalPosts: number
  totalSubscribers: number
  createdAt: string
  launchedAt?: string
  owner: {
    id: string
    name?: string
    email: string
  }
  blogs: Array<{
    id: string
    title: string
    description?: string
    slug: string
    status: string
    publishedAt?: string
    createdAt: string
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

interface SiteAdminDashboardProps {
  site: Site
}

export default function SiteAdminDashboard({ site }: SiteAdminDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800"
      case "DRAFT": return "bg-yellow-100 text-yellow-800"
      case "SUSPENDED": return "bg-red-100 text-red-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSiteStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "SUSPENDED": return "bg-red-100 text-red-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: site.primaryColor || "#3b82f6" }}
          >
            {site.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{site.name}</h1>
              <Badge className={getSiteStatusColor(site.status)}>
                {site.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {site.subdomain}.yourdomain.com
              </span>
              <span>•</span>
              <span>{site.category}</span>
              <span>•</span>
              <span>{site._count.blogs} posts</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/sites/${site.id}/posts/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
          <Link href={`/sites/${site.id}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button variant="outline" asChild>
            <Link href={`/${site.subdomain}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Site
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{site.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published Posts</p>
                <p className="text-2xl font-bold">{site._count.blogs}</p>
              </div>
              <Edit className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscribers</p>
                <p className="text-2xl font-bold">{site.totalSubscribers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">
                  {site.blogs.reduce((sum, blog) => sum + blog._count.interactions, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/sites/${site.id}/posts/new`}>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Write New Post
              </Button>
            </Link>
            <Link href={`/sites/${site.id}/analytics`}>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link href={`/sites/${site.id}/settings`}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Site Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Site Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(site.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="secondary">{site.category}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Theme</p>
              <p className="font-medium capitalize">{site.theme}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {site.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {site.tags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Posts</CardTitle>
            <Link href={`/sites/${site.id}/posts`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <CardDescription>
            Your latest blog posts and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {site.blogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No posts yet</p>
              <Link href={`/sites/${site.id}/posts/new`}>
                <Button>Write your first post</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {site.blogs.map((blog) => (
                <div key={blog.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{blog.title}</h3>
                        <Badge className={getStatusColor(blog.status)}>
                          {blog.status}
                        </Badge>
                      </div>

                      {blog.description && (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {blog.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {blog._count.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {blog._count.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {blog._count.interactions}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {blog.publishedAt
                            ? `Published ${new Date(blog.publishedAt).toLocaleDateString()}`
                            : `Created ${new Date(blog.createdAt).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {blog.status === "PUBLISHED" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/${site.subdomain}/${blog.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/sites/${site.id}/posts/${blog.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}