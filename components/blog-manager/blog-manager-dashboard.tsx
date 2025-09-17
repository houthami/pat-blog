"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Plus, Search, Filter, Eye, MessageCircle, Heart, Edit, Trash2, Calendar, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Blog {
  id: string
  title: string
  description?: string
  slug: string
  imageUrl?: string
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED"
  publishedAt?: string
  createdAt: string
  updatedAt: string
  isPrivate: boolean
  categories: string[]
  tags: string[]
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

interface BlogsResponse {
  blogs: Blog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function BlogManagerDashboard() {
  const { data: session } = useSession()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    views: 0
  })

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/blogs?${params}`)
      if (!response.ok) throw new Error("Failed to fetch blogs")

      const data: BlogsResponse = await response.json()
      setBlogs(data.blogs)
      setTotalPages(data.pagination.pages)

      // Calculate stats
      const totalViews = data.blogs.reduce((sum, blog) => sum + blog._count.views, 0)
      setStats({
        total: data.pagination.total,
        published: data.blogs.filter(blog => blog.status === "PUBLISHED").length,
        drafts: data.blogs.filter(blog => blog.status === "DRAFT").length,
        views: totalViews
      })

    } catch (error) {
      console.error("Error fetching blogs:", error)
      toast.error("Failed to fetch blogs")
    } finally {
      setLoading(false)
    }
  }

  const deleteBlog = async (blogId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete blog")

      toast.success("Blog deleted successfully")
      fetchBlogs() // Refresh the list
    } catch (error) {
      console.error("Error deleting blog:", error)
      toast.error("Failed to delete blog")
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [page, statusFilter, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800"
      case "DRAFT": return "bg-yellow-100 text-yellow-800"
      case "SUSPENDED": return "bg-red-100 text-red-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (!session?.user || session.user.role !== "SUPER_USER") {
    return <div>Access denied</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Manager</h1>
          <p className="text-muted-foreground">Manage your blog posts and content</p>
        </div>
        <Link href="/blog-manager/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Blog Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Blogs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats.drafts}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.views}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Blog List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Blog Posts</CardTitle>
          <CardDescription>
            Manage and monitor your blog content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No blogs found</p>
              <Link href="/blog-manager/new">
                <Button>Create your first blog post</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div key={blog.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {blog.imageUrl && (
                          <img
                            src={blog.imageUrl}
                            alt={blog.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{blog.title}</h3>
                            <Badge className={getStatusColor(blog.status)}>
                              {blog.status}
                            </Badge>
                            {blog.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
                          </div>

                          {blog.description && (
                            <p className="text-muted-foreground mb-2 line-clamp-2">
                              {blog.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {blog._count.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {blog._count.comments}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {blog._count.interactions}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {blog.categories.slice(0, 3).map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {blog.categories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{blog.categories.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {blog.publishedAt
                              ? `Published ${new Date(blog.publishedAt).toLocaleDateString()}`
                              : `Created ${new Date(blog.createdAt).toLocaleDateString()}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {blog.status === "PUBLISHED" && (
                        <Link href={`/blog/${blog.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/blog-manager/${blog.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBlog(blog.id, blog.title)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}